from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def get_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(
        select(User).where(User.email == email.strip().lower())
    )
    return result.scalar_one_or_none()


async def create(db: AsyncSession, name: str, email: str, hashed_password: str) -> User:
    user = User(
        name=name.strip(),
        email=email.strip().lower(),
        hashed_password=hashed_password,
        role="user",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def email_exists(db: AsyncSession, email: str) -> bool:
    result = await db.execute(
        select(User.id).where(User.email == email.strip().lower())
    )
    return result.scalar_one_or_none() is not None
