"""add actions.id

Revision ID: 9e393dd028a7
Revises: afe1e469c3ca
Create Date: 2026-05-12 12:33:58.329796

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9e393dd028a7"
down_revision: str | None = "afe1e469c3ca"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "actions",
        sa.Column(
            "id", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False
        ),
    )
    op.create_primary_key("actions_pkey", "actions", ["id"])


def downgrade() -> None:
    op.drop_constraint("actions_pkey", "actions")
    op.drop_column("actions", "id")
