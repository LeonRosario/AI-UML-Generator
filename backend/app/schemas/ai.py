from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, field_validator

DiagramType = Literal[
    "use-case", "class", "sequence", "activity", "er", "state", "component", "deployment"
]


# ── Generate diagram ──────────────────────────────────────────────────────────

class GenerateDiagramRequest(BaseModel):
    requirements: str
    type: DiagramType

    @field_validator("requirements")
    @classmethod
    def requirements_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 10:
            raise ValueError("Requirements must be at least 10 characters.")
        return v


class AiNodePayload(BaseModel):
    """Matches the TypeScript AiNodePayload type."""
    id: str
    type: str
    position: dict[str, float] = {"x": 0, "y": 0}
    data: dict[str, Any] = {}

    model_config = {"extra": "allow"}


class AiEdgePayload(BaseModel):
    """Matches the TypeScript AiEdgePayload type."""
    id: str
    source: str
    target: str
    type: str | None = None
    label: str | None = None

    model_config = {"extra": "allow"}


class GenerateDiagramResponse(BaseModel):
    """
    Matches the TypeScript AiDiagramPayload type.
    Returned by POST /ai/generate-diagram.
    """
    name: str
    type: str
    nodes: list[AiNodePayload]
    edges: list[AiEdgePayload]


# ── Modify diagram ────────────────────────────────────────────────────────────

class ModifyDiagramRequest(BaseModel):
    instructions: str
    diagram: dict[str, Any]  # Full Diagram JSON from frontend


class ModifyDiagramResponse(BaseModel):
    """
    Matches the TypeScript AiModifyResult type.
    Returned by POST /ai/modify-diagram.
    """
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]
    applied: list[str]
    message: str


# ── Explain diagram ───────────────────────────────────────────────────────────

class ExplainDiagramRequest(BaseModel):
    diagram: dict[str, Any]  # Full Diagram JSON from frontend


class EntityRef(BaseModel):
    name: str
    kind: str


class RelationshipRef(BaseModel):
    from_: str
    to: str
    type: str
    label: str | None = None

    model_config = {"populate_by_name": True}


class ExplainDiagramResponse(BaseModel):
    """
    Matches the TypeScript ExplainResult type.
    Returned by POST /ai/explain-diagram.
    """
    overview: str
    entities: list[dict[str, Any]]
    relationships: list[dict[str, Any]]
    architecture: str
    problems: list[str]
    suggestions: list[str]
