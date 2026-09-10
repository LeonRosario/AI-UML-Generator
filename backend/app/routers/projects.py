from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.database import get_db
from app.dependencies import get_current_user
from app.models.diagram import Diagram
from app.models.project import Project
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["projects"])

class ProjectIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=1000)

def out(p: Project, count: int = 0) -> dict:
    return {"id": p.id, "name": p.name, "description": p.description, "ownerId": p.owner_id,
            "createdAt": p.created_at.isoformat(), "updatedAt": p.updated_at.isoformat(), "diagramCount": count}

async def owned(db: AsyncSession, project_id: str, user_id: str) -> Project:
    project = (await db.execute(select(Project).where(Project.id == project_id))).scalar_one_or_none()
    if not project: raise NotFoundError("Project not found.")
    if project.owner_id != user_id: raise ForbiddenError("You do not have access to this project.")
    return project

@router.get("")
async def list_projects(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[dict]:
    rows = await db.execute(select(Project, func.count(Diagram.id)).outerjoin(Diagram).where(Project.owner_id == current_user.id).group_by(Project.id).order_by(Project.updated_at.desc()))
    return [out(p, count) for p, count in rows.all()]

@router.post("", status_code=201)
async def create_project(body: ProjectIn, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    p = Project(name=body.name.strip(), description=body.description.strip(), owner_id=current_user.id)
    db.add(p); await db.commit(); await db.refresh(p)
    return out(p)

@router.get("/{project_id}")
async def get_project(project_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    p = await owned(db, project_id, current_user.id)
    count = await db.scalar(select(func.count(Diagram.id)).where(Diagram.project_id == p.id)) or 0
    return out(p, count)

@router.put("/{project_id}")
async def update_project(project_id: str, body: ProjectIn, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    p = await owned(db, project_id, current_user.id); p.name = body.name.strip(); p.description = body.description.strip()
    await db.commit(); await db.refresh(p); return out(p)

@router.delete("/{project_id}")
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    p = await owned(db, project_id, current_user.id); await db.delete(p); await db.commit(); return {}
