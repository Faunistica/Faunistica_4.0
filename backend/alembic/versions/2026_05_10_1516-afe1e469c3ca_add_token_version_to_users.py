"""add token_version to users

Revision ID: afe1e469c3ca
Revises: 8b5c5cd24625
Create Date: 2026-05-10 15:16:02.130665

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "afe1e469c3ca"
down_revision: str | None = "8b5c5cd24625"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("token_version", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("users", "token_version")
