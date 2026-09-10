from __future__ import annotations

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

_settings = get_settings()

# ── Password hashing ─────────────────────────────────────────────────────────

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT ───────────────────────────────────────────────────────────────────────

COOKIE_NAME = "umlforge_session"


def create_access_token(user_id: str, remember: bool = False) -> str:
    """Encode a signed JWT containing the user's id."""
    if remember:
        expires_delta = timedelta(days=_settings.jwt_remember_days)
    else:
        expires_delta = timedelta(minutes=_settings.jwt_expire_minutes)

    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, _settings.jwt_secret_key, algorithm=_settings.jwt_algorithm)


def decode_access_token(token: str) -> str | None:
    """Decode and validate a JWT.  Returns the user_id (sub) or None."""
    try:
        payload = jwt.decode(
            token,
            _settings.jwt_secret_key,
            algorithms=[_settings.jwt_algorithm],
        )
        user_id: str | None = payload.get("sub")
        return user_id
    except JWTError:
        return None
