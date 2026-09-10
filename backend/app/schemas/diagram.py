from __future__ import annotations

from typing import Any

from app.schemas.gantt import GanttChart

from pydantic import BaseModel


# ── React Flow node/edge shapes ───────────────────────────────────────────────
# These mirror the TypeScript types in src/types/index.ts

class Position(BaseModel):
    x: float
    y: float


class DiagramNode(BaseModel):
    id: str
    type: str | None = None
    position: Position
    data: dict[str, Any] = {}
    selected: bool | None = None
    dragging: bool | None = None
    width: float | None = None
    height: float | None = None
    style: dict[str, Any] | None = None
    className: str | None = None

    model_config = {"extra": "allow"}


class DiagramEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str | None = None
    label: str | None = None
    data: dict[str, Any] | None = None
    style: dict[str, Any] | None = None
    animated: bool | None = None
    markerEnd: Any | None = None
    markerStart: Any | None = None
    sourceHandle: str | None = None
    targetHandle: str | None = None

    model_config = {"extra": "allow"}


# ── Diagram payload ───────────────────────────────────────────────────────────


class DiagramIn(BaseModel):
    """
    Full diagram sent by the frontend for saving (PUT /diagrams/{id}).
    Matches the frontend Diagram type exactly.
    """
    id: str
    name: str
    type: str
    nodes: list[DiagramNode] = []
    edges: list[DiagramEdge] = []
    createdAt: str | None = None
    updatedAt: str | None = None
    ownerId: str | None = None
    gantt: GanttChart | None = None
    layers: list[dict[str, Any]] | None = None
    preferences: dict[str, Any] | None = None

    model_config = {"extra": "allow"}


class DiagramOut(BaseModel):
    """
    Full diagram returned by the backend. Matches the frontend Diagram type.
    All fields use camelCase to match the TypeScript interface.
    """
    id: str
    name: str
    type: str
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    createdAt: str
    updatedAt: str
    ownerId: str | None = None
    gantt: GanttChart | None = None
    layers: list[dict[str, Any]] | None = None
    preferences: dict[str, Any] | None = None

    model_config = {"from_attributes": True}


class DiagramMeta(BaseModel):
    """
    Lightweight summary of a diagram, matching the frontend DiagramMeta type.
    Returned by GET /diagrams (list endpoint).
    """
    id: str
    name: str
    type: str
    createdAt: str
    updatedAt: str
    ownerId: str | None = None
    saved: bool = True

    model_config = {"from_attributes": True}
