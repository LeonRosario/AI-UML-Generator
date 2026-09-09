"""add projects and diagram project association"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"

def upgrade() -> None:
    op.create_table("projects", sa.Column("id", sa.String(36), primary_key=True), sa.Column("name", sa.String(255), nullable=False), sa.Column("description", sa.String(1000), nullable=False, server_default=""), sa.Column("owner_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))
    op.create_index("ix_projects_owner_id", "projects", ["owner_id"])
    op.add_column("diagrams", sa.Column("project_id", sa.String(36), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True))
    op.create_index("ix_diagrams_project_id", "diagrams", ["project_id"])

def downgrade() -> None:
    op.drop_index("ix_diagrams_project_id", table_name="diagrams"); op.drop_column("diagrams", "project_id")
    op.drop_index("ix_projects_owner_id", table_name="projects"); op.drop_table("projects")
