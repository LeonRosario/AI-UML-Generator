from __future__ import annotations

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import (
    ExplainDiagramRequest,
    ExplainDiagramResponse,
    GenerateDiagramRequest,
    GenerateDiagramResponse,
    ModifyDiagramRequest,
    ModifyDiagramResponse,
)
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


# ── POST /ai/generate-diagram ─────────────────────────────────────────────────

@router.post("/generate-diagram", response_model=GenerateDiagramResponse)
async def generate_diagram(
    body: GenerateDiagramRequest,
    current_user: User = Depends(get_current_user),
) -> GenerateDiagramResponse:
    """
    Generate a UML diagram from natural language requirements.
    
    Request:  { requirements: string, type: DiagramType }
    Response: AiDiagramPayload { name, type, nodes[], edges[] }
    """
    return await ai_service.generate_diagram(
        requirements=body.requirements,
        diagram_type=body.type,
    )


# ── POST /ai/modify-diagram ───────────────────────────────────────────────────

@router.post("/modify-diagram", response_model=ModifyDiagramResponse)
async def modify_diagram(
    body: ModifyDiagramRequest,
    current_user: User = Depends(get_current_user),
) -> ModifyDiagramResponse:
    """
    Apply natural language modifications to an existing diagram.

    Request:  { instructions: string, diagram: Diagram }
    Response: AiModifyResult { nodes[], edges[], applied[], message }
    """
    return await ai_service.modify_diagram(
        instructions=body.instructions,
        diagram=body.diagram,
    )


# ── POST /ai/explain-diagram ──────────────────────────────────────────────────

@router.post("/explain-diagram", response_model=ExplainDiagramResponse)
async def explain_diagram(
    body: ExplainDiagramRequest,
    current_user: User = Depends(get_current_user),
) -> ExplainDiagramResponse:
    """
    Analyze and explain an existing diagram.

    Request:  { diagram: Diagram }
    Response: ExplainResult { overview, entities[], relationships[], architecture, problems[], suggestions[] }
    """
    return await ai_service.explain_diagram(diagram=body.diagram)
