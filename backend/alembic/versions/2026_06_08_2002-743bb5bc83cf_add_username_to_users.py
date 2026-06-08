"""add_username_to_users

Revision ID: 743bb5bc83cf
Revises: f3a8b9127d4c
Create Date: 2026-06-08 20:02:07.183364

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "743bb5bc83cf"
down_revision: str | None = "f3a8b9127d4c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("username", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "username")
