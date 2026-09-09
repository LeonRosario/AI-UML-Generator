from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.repositories import diagram_repo
from app.schemas.diagram import DiagramMeta, DiagramOut


def _iso(dt: datetime) -> str:
    """Return ISO 8601 string with Z suffix."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def _diagram_to_out(d, include_data: bool = True) -> dict[str, Any]:
    """Convert a Diagram ORM object to the full dict the frontend expects."""
    data = json.loads(d.data) if d.data else {}
    result: dict[str, Any] = {
        "id": d.id,
        "name": d.name,
        "type": d.type,
        "createdAt": _iso(d.created_at),
        "updatedAt": _iso(d.updated_at),
        "ownerId": d.owner_id,
        "saved": True,
    }
    if include_data:
        result["nodes"] = data.get("nodes", [])
        result["edges"] = data.get("edges", [])
    return result


async def list_diagrams(db: AsyncSession, owner_id: str) -> list[dict[str, Any]]:
    diagrams = await diagram_repo.list_by_owner(db, owner_id)
    # Return DiagramMeta list (without full nodes/edges)
    return [_diagram_to_out(d, include_data=False) for d in diagrams]


async def get_diagram(db: AsyncSession, diagram_id: str, owner_id: str) -> dict[str, Any]:
    d = await diagram_repo.get_by_id(db, diagram_id)
    if not d:
        raise NotFoundError("Diagram not found.")
    if d.owner_id != owner_id:
        raise ForbiddenError("You do not have access to this diagram.")
    return _diagram_to_out(d, include_data=True)


async def save_diagram(
    db: AsyncSession,
    diagram_id: str,
    owner_id: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """Upsert a diagram.  If it exists, verify ownership first."""
    existing = await diagram_repo.get_by_id(db, diagram_id)
    if existing and existing.owner_id != owner_id:
        raise ForbiddenError("You do not have access to this diagram.")

    # Store nodes + edges in the data column; strip frontend-generated fields
    data = {
        "nodes": payload.get("nodes", []),
        "edges": payload.get("edges", []),
    }
    d = await diagram_repo.upsert(
        db,
        diagram_id=diagram_id,
        name=payload.get("name", "Untitled"),
        dtype=payload.get("type", "class"),
        owner_id=owner_id,
        data=data,
    )
    return _diagram_to_out(d, include_data=True)


async def delete_diagram(db: AsyncSession, diagram_id: str, owner_id: str) -> None:
    d = await diagram_repo.get_by_id(db, diagram_id)
    if not d:
        raise NotFoundError("Diagram not found.")
    if d.owner_id != owner_id:
        raise ForbiddenError("You do not have access to this diagram.")
    await diagram_repo.delete_by_id(db, diagram_id)
