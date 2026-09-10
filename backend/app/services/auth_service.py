from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories import user_repo
from app.schemas.auth import UserOut


async def register_user(db: AsyncSession, name: str, email: str, password: str) -> User:
    """Create a new user account.  Raises ConflictError if email is taken."""
    if await user_repo.email_exists(db, email):
        raise ConflictError("An account with this email already exists.")
    hashed = hash_password(password)
    return await user_repo.create(db, name=name, email=email, hashed_password=hashed)


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    """Verify credentials and return the User.  Raises UnauthorizedError on failure."""
    user = await user_repo.get_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise UnauthorizedError("Invalid email or password.")
    return user


def to_user_out(user: User) -> UserOut:
    return UserOut(id=user.id, name=user.name, email=user.email, role=user.role)
