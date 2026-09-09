from __future__ import annotations

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import TimestampMixin


class Diagram(TimestampMixin, Base):
    """
    Stores a UML diagram belonging to a user.

    The `data` column stores the full diagram JSON (nodes[] + edges[])
    as produced by the frontend. We use TEXT/JSONB so the entire graph
    round-trips without loss.
    """

    __tablename__ = "diagrams"

    # Frontend generates IDs like "diag-123-abc5" — we accept them as-is
    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    owner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    project_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    # Stores nodes/edges as JSON text; works with both SQLite and PostgreSQL
    data: Mapped[str] = mapped_column(Text, nullable=False, default="{}")

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="diagrams")  # noqa: F821
    project: Mapped["Project | None"] = relationship("Project", back_populates="diagrams")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Diagram id={self.id!r} name={self.name!r} owner={self.owner_id!r}>"
