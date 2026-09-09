from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.diagram import DiagramIn
from app.services import diagram_service

router = APIRouter(prefix="/diagrams", tags=["diagrams"])


# ── GET /diagrams ─────────────────────────────────────────────────────────────

@router.get("", response_model=list[dict[str, Any]])
async def list_diagrams(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """List all diagrams belonging to the current user (metadata only)."""
    return await diagram_service.list_diagrams(db, owner_id=current_user.id)


# ── GET /diagrams/{diagram_id} ────────────────────────────────────────────────

@router.get("/{diagram_id}", response_model=dict[str, Any])
async def get_diagram(
    diagram_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Return the full diagram (nodes + edges) for the given ID."""
    return await diagram_service.get_diagram(db, diagram_id=diagram_id, owner_id=current_user.id)


# ── PUT /diagrams/{diagram_id} ────────────────────────────────────────────────

@router.put("/{diagram_id}", response_model=dict[str, Any])
async def save_diagram(
    diagram_id: str,
    body: DiagramIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Create or update a diagram.  The frontend sends the full Diagram object."""
    payload = body.model_dump(mode="python")
    # Ensure the ID in the body matches the URL parameter
    payload["id"] = diagram_id
    return await diagram_service.save_diagram(
        db, diagram_id=diagram_id, owner_id=current_user.id, payload=payload
    )


# ── DELETE /diagrams/{diagram_id} ─────────────────────────────────────────────

@router.delete("/{diagram_id}")
async def delete_diagram(
    diagram_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a diagram owned by the current user."""
    await diagram_service.delete_diagram(db, diagram_id=diagram_id, owner_id=current_user.id)
    return {}
