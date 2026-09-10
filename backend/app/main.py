from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.core.exceptions import UMLForgeError
from app.database import create_all_tables
from app.routers import ai, auth, diagrams, projects

logger = logging.getLogger(__name__)
_settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI(
        title="UMLForge API",
        description="Backend for the UMLForge AI-powered UML diagram generator.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Must allow credentials (cookies) and specify exact origins (no wildcard).
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception handlers ────────────────────────────────────────────────────

    @app.exception_handler(UMLForgeError)
    async def umlforge_error_handler(_: Request, exc: UMLForgeError) -> JSONResponse:
        """Return all application errors as { "detail": "..." } JSON."""
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.exception_handler(Exception)
    async def generic_error_handler(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error: %s", exc)
        # Never leak internal details in production
        detail = str(exc) if _settings.debug else "An unexpected error occurred."
        return JSONResponse(status_code=500, content={"detail": detail})

    # ── Startup ───────────────────────────────────────────────────────────────

    @app.on_event("startup")
    async def startup() -> None:
        if _settings.is_sqlite:
            # Auto-create tables for SQLite (Alembic is optional for SQLite)
            await create_all_tables()
            logger.info("SQLite tables created/verified.")
        logger.info("UMLForge API started — env=%s", _settings.app_env)

    # ── Routers ───────────────────────────────────────────────────────────────

    app.include_router(auth.router)
    app.include_router(diagrams.router)
    app.include_router(projects.router)
    app.include_router(ai.router)

    # ── Health check ──────────────────────────────────────────────────────────

    @app.get("/health", tags=["system"])
    async def health() -> dict:
        return {"status": "ok", "version": "1.0.0"}

    return app


app = create_app()
