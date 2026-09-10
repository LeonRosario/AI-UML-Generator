from __future__ import annotations

"""
AI Service — powers /ai/generate-diagram, /ai/modify-diagram, /ai/explain-diagram.

Uses AI_PROVIDER first, then the other configured provider on failure.
There is no offline provider. Missing credentials return a clear 400 error.

The service always returns the exact JSON shapes the frontend TypeScript types expect:
  - GenerateDiagramResponse  (AiDiagramPayload)
  - ModifyDiagramResponse    (AiModifyResult)
  - ExplainDiagramResponse   (ExplainResult)
"""

import json
import logging
import re
import textwrap
import asyncio
from datetime import date
from pydantic import ValidationError
from app.schemas.gantt import GanttChart
from typing import Any

from app.config import get_settings
from app.core.exceptions import AIProviderError, BadRequestError
from app.schemas.ai import (
    AiEdgePayload,
    AiNodePayload,
    ExplainDiagramResponse,
    GenerateDiagramResponse,
    ModifyDiagramResponse,
)

logger = logging.getLogger(__name__)
_settings = get_settings()

DIAGRAM_TYPE_LABELS: dict[str, str] = {
    "use-case": "Use Case Diagram",
    "class": "Class Diagram",
    "sequence": "Sequence Diagram",
    "activity": "Activity Diagram",
    "er": "ER Diagram",
    "state": "State Diagram",
    "component": "Component Diagram",
    "deployment": "Deployment Diagram",
    "flowchart": "Flowchart",
    "network": "Network Diagram",
    "architecture": "Cloud / System Architecture Diagram",
    "gantt": "Gantt Chart",
}

# Keep AI output constrained to node types that the React Flow editor registers.
# This is deliberately explicit: unknown provider output must not reach the UI.
SUPPORTED_NODE_TYPES = {
    "classNode", "interfaceNode", "abstractClassNode", "objectNode", "packageNode", "componentNode", "umlNode", "actorNode", "useCaseNode", "systemBoundaryNode", "interfaceSymbolNode", "noteNode", "databaseNode", "rectangleNode", "circleNode", "textNode", "imageNode", "entityNode", "genericNode",
    "flowProcessNode", "flowDecisionNode", "flowTerminatorNode", "flowInputOutputNode", "flowDocumentNode", "flowDatabaseNode", "flowConnectorNode", "flowOffPageNode",
    "erEntityNode", "erWeakEntityNode", "erAttributeNode", "erRelationshipNode", "erDatabaseNode", "erTableNode",
    "sequenceActorNode", "sequenceLifelineNode", "sequenceBoundaryNode", "sequenceControlNode", "sequenceEntityNode", "sequenceFragmentNode",
    "activityInitialNode", "activityActionNode", "activityDecisionNode", "activityForkNode", "activityFinalNode", "swimlaneNode",
    "stateInitialNode", "stateNode", "stateChoiceNode", "stateFinalNode", "deploymentDeviceNode", "deploymentNode", "deploymentEnvironmentNode", "artifactNode",
    "networkRouterNode", "networkSwitchNode", "networkFirewallNode", "networkServerNode", "networkClientNode", "networkCloudNode",
    "archServerNode", "archClientNode", "archApiNode", "archCacheNode", "archQueueNode", "archServiceNode", "archGatewayNode", "archCloudNode",
    "cloudComputeNode", "cloudStorageNode", "cloudNetworkNode", "cloudMonitoringNode",
}

# ─── Prompt templates ────────────────────────────────────────────────────────

_GENERATE_SYSTEM = textwrap.dedent("""
You are a UML diagram expert. Generate a {diagram_type} for the requirements below.

Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

The JSON must have this exact structure:
{{
  "name": "<short descriptive diagram name>",
  "type": "{type_key}",
  "nodes": [
    {{
      "id": "<unique-string-id>",
      "type": "<nodeType>",
      "position": {{"x": <number>, "y": <number>}},
      "data": {{
        "name": "<label>",
        ...additional fields depending on node type...
      }}
    }}
  ],
  "edges": [
    {{
      "id": "<unique-string-id>",
      "source": "<source-node-id>",
      "target": "<target-node-id>",
      "type": "<relationship-type>",
      "label": "<optional-label>"
    }}
  ]
}}

Node type guide:
- Class diagram    → type: "classNode"     data: {{name, attributes: ["- id: int"], methods: ["+ login(): void"]}}
- Use case diagram → actors: "actorNode"   data: {{name}}; use cases: "useCaseNode" data: {{name}}
- Sequence diagram → "genericNode"         data: {{name, variant: "lifeline"}}
- Activity diagram → "genericNode"         data: {{name, variant: "step"|"decision"|"start"|"end"}}
- ER diagram       → "databaseNode"        data: {{name, fields: ["id: int (PK)"]}}
- State diagram    → "umlNode"             data: {{name}}
- Component        → "componentNode"       data: {{name}}
- Flowchart        → "flowProcessNode", "flowDecisionNode", "flowTerminatorNode", "flowInputOutputNode", "flowDocumentNode", "flowDatabaseNode", "flowConnectorNode", "flowOffPageNode"; label decision edges Yes/No and use standard flowchart notation.
- Network          → "networkRouterNode", "networkSwitchNode", "networkFirewallNode", "networkServerNode", "networkClientNode", "networkCloudNode"; model topology, security boundaries and label protocols.
- Architecture     → "archApiNode", "archCacheNode", "archQueueNode", "archServiceNode", "archGatewayNode", "archServerNode", "archClientNode", "archCloudNode", "cloudComputeNode", "cloudStorageNode", "cloudNetworkNode", "cloudMonitoringNode"; model service and data flows, label interfaces.
- Deployment       → "umlNode"             data: {{name, stereotype: "server"|"device"|"service"}}

Relationship types: "association", "directed-association", "inheritance", "composition",
                    "aggregation", "dependency", "realization"

Rules:
- Generate 4-8 nodes for clarity.
- Space nodes evenly: x from 0 to 800, y from 0 to 600.
- All node IDs and edge IDs must be unique strings.
- Edge source/target must reference existing node IDs exactly.
- Use PascalCase for class/entity names.
""").strip()

_MODIFY_SYSTEM = textwrap.dedent("""
You are a UML diagram editing assistant. Apply the requested changes to the existing diagram.

Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

The JSON must have this exact structure:
{{
  "nodes": [ ...complete updated node list... ],
  "edges": [ ...complete updated edge list... ],
  "applied": ["<description of change 1>", ...],
  "message": "<human-friendly summary>"
}}

Rules:
- Return the COMPLETE list of nodes and edges (not just the changed ones).
- Preserve all existing node IDs and positions that are not being changed.
- New nodes should be placed near the existing cluster.
- If you cannot determine what to change, return the original unchanged nodes/edges
  with applied=[] and a helpful message explaining what you need.
- Node and edge schemas are the same as for diagram generation.
""").strip()

_EXPLAIN_SYSTEM = textwrap.dedent("""
You are a UML diagram analyzer. Analyze the provided diagram and return a structured explanation.

Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

The JSON must have this exact structure:
{{
  "overview": "<2-3 sentence description of what the diagram models>",
  "entities": [
    {{"name": "<entity name>", "kind": "<node type string>"}}
  ],
  "relationships": [
    {{"from": "<entity name>", "to": "<entity name>", "type": "<rel type>", "label": "<optional>"}}
  ],
  "architecture": "<paragraph about the architectural style/pattern>",
  "problems": ["<issue 1>", ...],
  "suggestions": ["<suggestion 1>", ...]
}}

Be specific about the diagram type and its purpose. List real problems found in the graph
(disconnected nodes, missing methods, etc.). Provide actionable suggestions.
""").strip()


# ─── Provider implementations ─────────────────────────────────────────────────

async def _call_gemini(prompt: str) -> str:
    """Call Google Gemini and return the raw text response."""
    try:
        import google.generativeai as genai  # type: ignore[import]
        genai.configure(api_key=_settings.gemini_api_key)
        model = genai.GenerativeModel(_settings.gemini_model)
        # google-generativeai is synchronous.  Do not block FastAPI's event loop
        # while a provider request is in flight, and fail predictably on hangs.
        response = await asyncio.wait_for(asyncio.to_thread(
            model.generate_content, prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2, max_output_tokens=4096,
            ),
        ), timeout=45)
        return response.text
    except ImportError as exc:
        raise AIProviderError("google-generativeai package is not installed.") from exc
    except Exception as exc:
        logger.warning("Gemini request failed (%s)", type(exc).__name__)
        raise AIProviderError() from exc


async def _call_openai(prompt: str) -> str:
    """Call OpenAI and return the raw text response."""
    try:
        from openai import AsyncOpenAI  # type: ignore[import]
        async with AsyncOpenAI(api_key=_settings.openai_api_key, timeout=45, max_retries=0) as client:
            response = await client.chat.completions.create(
                model=_settings.openai_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=4096,
            )
        return response.choices[0].message.content or ""
    except ImportError as exc:
        raise AIProviderError("openai package is not installed.") from exc
    except Exception as exc:
        logger.warning("OpenAI request failed (%s)", type(exc).__name__)
        raise AIProviderError() from exc


async def _call_ai(prompt: str) -> str:
    """Try the configured provider, fall back to the other if available."""
    provider = _settings.ai_provider.lower()
    has_gemini = bool(_settings.gemini_api_key)
    has_openai = bool(_settings.openai_api_key)

    if not has_gemini and not has_openai:
        raise BadRequestError(
            "AI provider not configured. Set GEMINI_API_KEY or OPENAI_API_KEY in your .env file."
        )

    providers = [(_call_gemini, has_gemini), (_call_openai, has_openai)]
    if provider == "openai":
        providers.reverse()
    for call, configured in providers:
        if configured:
            try:
                return await call(prompt)
            except AIProviderError:
                continue
    raise AIProviderError("AI providers are unavailable. Check your credentials or try again later.")


# ─── JSON extraction ──────────────────────────────────────────────────────────

def _extract_json(text: str) -> dict[str, Any]:
    """
    Robustly extract JSON from an AI response that may contain
    markdown fences, explanatory text, or extra whitespace.
    """
    # Strip markdown code fences
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"```", "", text)
    text = text.strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find the outermost { ... } block
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    raise AIProviderError(
        "AI returned malformed JSON. Please try again with a clearer description."
    )


# ─── Validation helpers ───────────────────────────────────────────────────────

def _safe_str(v: Any, default: str = "") -> str:
    return str(v) if v is not None else default


def _validate_generate_response(data: dict[str, Any], diagram_type: str) -> GenerateDiagramResponse:
    """Validate and normalise the AI-generated diagram JSON."""
    if diagram_type == "gantt":
        try:
            chart = GanttChart.model_validate(data.get("gantt"))
            if not chart.tasks:
                raise ValueError("AI returned an empty schedule")
        except (ValidationError, ValueError) as exc:
            raise AIProviderError("AI returned an invalid Gantt schedule: check dates, durations and dependencies.") from exc
        return GenerateDiagramResponse(name=_safe_str(data.get("name"), "Project schedule"),
                                       type="gantt", nodes=[], edges=[], gantt=chart)
    if "nodes" not in data or not isinstance(data["nodes"], list):
        raise AIProviderError("AI response missing 'nodes' array.")
    if "edges" not in data or not isinstance(data["edges"], list):
        raise AIProviderError("AI response missing 'edges' array.")

    node_ids: set[str] = set()
    nodes: list[AiNodePayload] = []
    for i, raw in enumerate(data["nodes"]):
        if not isinstance(raw, dict):
            continue
        node_id = _safe_str(raw.get("id") or raw.get("data", {}).get("id"))
        if not node_id:
            raise AIProviderError("AI response contains a node without an ID.")
        if node_id in node_ids:
            raise AIProviderError("AI response contains duplicate node IDs.")
        if raw.get("type") not in SUPPORTED_NODE_TYPES:
            raise AIProviderError(f"AI response contains unsupported shape type: {raw.get('type')!r}.")
        if not isinstance(raw.get("data", {}), dict):
            raise AIProviderError("AI response contains malformed node data.")
        if not isinstance(raw.get("position", {}), dict):
            raise AIProviderError("AI response contains an invalid node position.")
        node_ids.add(node_id)
        pos = raw.get("position", {})
        try:
            x, y = float(pos.get("x")), float(pos.get("y"))
        except (TypeError, ValueError):
            raise AIProviderError("AI response contains an invalid node position.")
        nodes.append(
            AiNodePayload(
                id=node_id,
                type=_safe_str(raw.get("type"), "umlNode"),
                position={"x": x, "y": y},
                data=raw.get("data", {"name": f"Node {i}"}),
            )
        )

    if not nodes:
        raise AIProviderError("AI response contains no diagram nodes.")
    edges: list[AiEdgePayload] = []
    edge_ids: set[str] = set()
    for i, raw in enumerate(data.get("edges", [])):
        if not isinstance(raw, dict):
            continue
        src = _safe_str(raw.get("source"))
        tgt = _safe_str(raw.get("target"))
        edge_id = _safe_str(raw.get("id"))
        if not edge_id or edge_id in edge_ids:
            raise AIProviderError("AI response contains missing or duplicate edge IDs.")
        # A corrupted graph must be rejected, never silently repaired.
        if src not in node_ids or tgt not in node_ids:
            raise AIProviderError("AI response contains an edge with an unknown node reference.")
        edge_ids.add(edge_id)
        edges.append(
            AiEdgePayload(
                id=edge_id,
                source=src,
                target=tgt,
                type=raw.get("type"),
                label=raw.get("label"),
            )
        )

    name = _safe_str(data.get("name"), DIAGRAM_TYPE_LABELS.get(diagram_type, "Diagram"))
    return GenerateDiagramResponse(
        name=name,
        type=diagram_type,
        nodes=nodes,
        edges=edges,
    )


# ─── Public API ───────────────────────────────────────────────────────────────

async def generate_diagram(requirements: str, diagram_type: str) -> GenerateDiagramResponse:
    """Generate a new UML diagram from natural language requirements."""
    type_label = DIAGRAM_TYPE_LABELS.get(diagram_type, "Diagram")
    prompt = (
        _GENERATE_SYSTEM.format(diagram_type=type_label, type_key=diagram_type)
        + f"\n\nRequirements:\n{requirements}"
    )
    if diagram_type == "gantt":
        prompt = _gantt_prompt() + f"\n\nRequirements:\n{requirements}"
    raw = await _call_ai(prompt)
    data = _extract_json(raw)
    return _validate_generate_response(data, diagram_type)


async def modify_diagram(instructions: str, diagram: dict[str, Any]) -> ModifyDiagramResponse:
    """Apply natural language modifications to an existing diagram."""
    diagram_json = json.dumps(diagram, indent=2)
    prompt = (
        (_gantt_prompt() + "\nReturn complete updated gantt plus applied (string array) and message. Preserve unchanged task IDs. Reschedule successors when dates change." if diagram.get("type") == "gantt" else _MODIFY_SYSTEM)
        + f"\n\nInstruction:\n{instructions}"
        + f"\n\nExisting diagram JSON:\n{diagram_json}"
    )
    raw = await _call_ai(prompt)
    data = _extract_json(raw)

    chart = None
    if diagram.get("type") == "gantt":
        chart = _validate_generate_response(data, "gantt").gantt
    return ModifyDiagramResponse(
        gantt=chart,
        nodes=data.get("nodes", diagram.get("nodes", [])),
        edges=data.get("edges", diagram.get("edges", [])),
        applied=data.get("applied", []),
        message=_safe_str(
            data.get("message"),
            f"Applied {len(data.get('applied', []))} change(s) to your diagram.",
        ),
    )


async def explain_diagram(diagram: dict[str, Any]) -> ExplainDiagramResponse:
    """Analyze a diagram and return a structured explanation."""
    diagram_json = json.dumps(diagram, indent=2)
    prompt = _EXPLAIN_SYSTEM + ("\nThis is a Gantt schedule. Explain tasks as entities, dependencies as relationships, ownership, milestones, progress and scheduling risks. Do not report missing graph nodes." if diagram.get("type") == "gantt" else "") + f"\n\nDiagram JSON:\n{diagram_json}"
    raw = await _call_ai(prompt)
    data = _extract_json(raw)

    return ExplainDiagramResponse(
        overview=_safe_str(data.get("overview"), "This diagram models a software system."),
        entities=data.get("entities", []),
        relationships=data.get("relationships", []),
        architecture=_safe_str(data.get("architecture"), "Standard UML model."),
        problems=data.get("problems", []),
        suggestions=data.get("suggestions", []),
    )


def _gantt_prompt() -> str:
    return """You are a project scheduling assistant. Turn the requirements into a realistic, nonempty schedule.
Return ONLY JSON with name, type: "gantt", nodes: [], edges: [], gantt: {tasks: [...]}.
Each task has id (unique string), name, start (YYYY-MM-DD), duration (integer calendar days),
assignee (person/team or Unassigned), progress (integer 0-100), milestone (boolean),
dependencies (array of predecessor task IDs, finish-to-start).
Regular tasks have duration >= 1. Milestones are diamonds with duration 0.
Respect explicit dates, durations, owners and dependencies in the request. Infer reasonable estimates
when missing and break the project into meaningful tasks. Include a completion milestone.
No dependency cycles or unknown references. Start each task on or after every predecessor's exclusive
end date (start + duration). Parallel independent work may overlap. Use at most 60 tasks and ten years.
Preserve the schedule schema during edits. Never convert tasks into graph nodes.
Today's date: """ + date.today().isoformat()
