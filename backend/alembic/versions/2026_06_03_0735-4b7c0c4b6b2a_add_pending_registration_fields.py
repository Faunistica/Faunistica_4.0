"""add pending registration fields
Revision ID: 4b7c0c4b6b2a
Revises: 3f4b8a9b1d7c
Create Date: 2026-06-03 07:35:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "4b7c0c4b6b2a"
down_revision: str | None = "3f4b8a9b1d7c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "pending_registrations", sa.Column("age", sa.Integer(), nullable=True)
    )
    op.add_column(
        "pending_registrations",
        sa.Column("language", sa.String(length=10), nullable=True),
    )
    op.add_column(
        "pending_registrations", sa.Column("comm", sa.String(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("pending_registrations", "comm")
    op.drop_column("pending_registrations", "language")
    op.drop_column("pending_registrations", "age")
