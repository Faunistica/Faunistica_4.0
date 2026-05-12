"""add non-null constraints

Revision ID: b30dafb6539a
Revises: 9e393dd028a7
Create Date: 2026-05-12 13:02:03.990536

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b30dafb6539a"
down_revision: str | None = "9e393dd028a7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("users", "reg_stat", server_default="0")

    op.execute("""
        UPDATE users
        SET reg_stat = 0
        WHERE reg_stat IS NULL
    """)

    op.alter_column(
        "users",
        "reg_stat",
        existing_type=sa.Integer(),
        nullable=False,
    )

    op.alter_column("users", "items", server_default="")

    op.execute("""
        UPDATE users
        SET items = ''
        WHERE items IS NULL
    """)

    op.alter_column(
        "users",
        "items",
        existing_type=sa.Text(),
        nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "users", "items", existing_type=sa.TEXT(), nullable=True, server_default=False
    )
    op.alter_column(
        "users",
        "reg_stat",
        existing_type=sa.INTEGER(),
        nullable=True,
        server_default=False,
    )
