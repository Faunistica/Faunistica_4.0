"""add_server_defaults

Revision ID: e81c775456a5
Revises: b30dafb6539a
Create Date: 2026-05-12 14:40:46.549612

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e81c775456a5"
down_revision: str | None = "b30dafb6539a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("users", "reg_run", server_default=sa.func.now())
    op.alter_column("actions", "datetime", server_default=sa.func.now())


def downgrade() -> None:
    op.alter_column("users", "reg_run", server_default=None)
    op.alter_column("actions", "datetime", server_default=None)
