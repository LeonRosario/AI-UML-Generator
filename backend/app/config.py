from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./umlforge.db"

    # ── JWT ───────────────────────────────────────────────────────────────────
    jwt_secret_key: str = "dev-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    jwt_remember_days: int = 30

    # ── AI ────────────────────────────────────────────────────────────────────
    gemini_api_key: str = ""
    openai_api_key: str = ""
    ai_provider: Literal["gemini", "openai"] = "gemini"
    gemini_model: str = "gemini-3.6-flash"
    openai_model: str = "gpt-4o-mini"

    # ── CORS ──────────────────────────────────────────────────────────────────
    frontend_url: str = "http://localhost:5173"

    # ── App ───────────────────────────────────────────────────────────────────
    app_env: str = "development"
    debug: bool = True

    @property
    def cookie_secure(self) -> bool:
        """Cookies may be insecure only in explicit local development."""
        return self.app_env.lower() not in {"development", "dev", "test"}

    # ── Derived ───────────────────────────────────────────────────────────────
    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.database_url.lower()

    @property
    def is_postgres(self) -> bool:
        return "postgresql" in self.database_url.lower() or "postgres" in self.database_url.lower()

    @property
    def allowed_origins(self) -> list[str]:
        origins = set(o.strip() for o in self.frontend_url.split(",") if o.strip())
        for o in list(origins):
            if "localhost" in o:
                origins.add(o.replace("localhost", "127.0.0.1"))
            elif "127.0.0.1" in o:
                origins.add(o.replace("127.0.0.1", "localhost"))
        return list(origins)

    @field_validator("database_url", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        # Accept plain postgres:// and convert to asyncpg driver
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://") and "asyncpg" not in v:
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
