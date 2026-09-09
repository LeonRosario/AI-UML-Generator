from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.exceptions import UnauthorizedError
from app.core.security import COOKIE_NAME, create_access_token
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import AuthResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest, UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])
_settings = get_settings()


def _set_session_cookie(response: Response, token: str, remember: bool) -> None:
    """
    Set the JWT as an HttpOnly cookie.
    - remember=True  → persistent cookie (30 days)
    - remember=False → session cookie (expires when browser closes)
    """
    max_age = int(timedelta(days=_settings.jwt_remember_days).total_seconds()) if remember else None
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=_settings.cookie_secure,
        max_age=max_age,
        path="/",
    )


# ── GET /auth/me ──────────────────────────────────────────────────────────────

@router.get("/me", response_model=AuthResponse)
async def me(current_user: User = Depends(get_current_user)) -> AuthResponse:
    """Return the currently authenticated user.  Used by the frontend on load."""
    return AuthResponse(user=UserOut.model_validate(current_user))


# ── POST /auth/register ───────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(
    body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Register a new user and immediately sign them in."""
    user = await auth_service.register_user(db, name=body.name, email=body.email, password=body.password)
    token = create_access_token(user.id, remember=True)
    _set_session_cookie(response, token, remember=True)
    return AuthResponse(
        user=UserOut.model_validate(user),
        access_token=token,
        token_type="bearer",
    )


# ── POST /auth/login ──────────────────────────────────────────────────────────

@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Authenticate and set session cookie."""
    user = await auth_service.authenticate_user(db, email=body.email, password=body.password)
    token = create_access_token(user.id, remember=body.remember)
    _set_session_cookie(response, token, remember=body.remember)
    return AuthResponse(
        user=UserOut.model_validate(user),
        access_token=token,
        token_type="bearer",
    )


# ── POST /auth/logout ─────────────────────────────────────────────────────────

@router.post("/logout")
async def logout(response: Response) -> dict:
    """Clear the session cookie."""
    response.delete_cookie(
        key=COOKIE_NAME, path="/", samesite="lax", secure=_settings.cookie_secure
    )
    return {}


# ── POST /auth/forgot-password ────────────────────────────────────────────────

@router.post("/forgot-password")
async def forgot_password(
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Always returns 200 regardless of whether the email exists
    (security best practice — prevents email enumeration).
    Email delivery is not implemented in this MVP.
    """
    # We still validate the email exists for logging, but don't reveal the result
    from app.repositories import user_repo  # noqa: PLC0415
    _ = await user_repo.get_by_email(db, body.email)
    return {}
