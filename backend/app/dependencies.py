from __future__ import annotations

from collections.abc import AsyncGenerator

from fastapi import Cookie, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import UnauthorizedError
from app.core.security import COOKIE_NAME, decode_access_token
from app.database import get_db
from app.models.user import User
from app.repositories import user_repo


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str | None = Cookie(default=None, alias=COOKIE_NAME),
    authorization: str | None = Header(default=None),
) -> User:
    """
    Dependency that extracts and validates the JWT from Authorization header or session cookie.
    Raises 401 if missing or invalid.
    """
    raw_token = token
    if not raw_token and authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            raw_token = parts[1]
        elif len(parts) == 1:
            raw_token = parts[0]

    if not raw_token:
        raise UnauthorizedError("Authentication required. Please sign in.")

    user_id = decode_access_token(raw_token)
    if not user_id:
        raise UnauthorizedError("Session expired. Please sign in again.")

    user = await user_repo.get_by_id(db, user_id)
    if not user:
        raise UnauthorizedError("User account not found.")

    return user
