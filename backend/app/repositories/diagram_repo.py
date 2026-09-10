from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.diagram import Diagram


async def list_by_owner(db: AsyncSession, owner_id: str) -> list[Diagram]:
    result = await db.execute(
        select(Diagram)
        .where(Diagram.owner_id == owner_id)
        .order_by(Diagram.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, diagram_id: str) -> Diagram | None:
    result = await db.execute(select(Diagram).where(Diagram.id == diagram_id))
    return result.scalar_one_or_none()


async def upsert(db: AsyncSession, diagram_id: str, name: str, dtype: str, owner_id: str, data: dict) -> Diagram:
    """Insert or update a diagram — matches frontend PUT /diagrams/{id} behavior."""
    existing = await get_by_id(db, diagram_id)
    now = datetime.now(timezone.utc)
    if existing:
        existing.name = name
        existing.type = dtype
        existing.data = json.dumps(data)
        existing.updated_at = now
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        diagram = Diagram(
            id=diagram_id,
            name=name,
            type=dtype,
            owner_id=owner_id,
            data=json.dumps(data),
            created_at=now,
            updated_at=now,
        )
        db.add(diagram)
        await db.commit()
        await db.refresh(diagram)
        return diagram


async def delete_by_id(db: AsyncSession, diagram_id: str) -> bool:
    result = await db.execute(
        delete(Diagram).where(Diagram.id == diagram_id)
    )
    await db.commit()
    return result.rowcount > 0
