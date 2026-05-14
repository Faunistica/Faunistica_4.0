"""add constraints

Revision ID: d9dda5d0fe5a
Revises: 27041cf0b012
Create Date: 2026-04-27 17:37:42.433543

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d9dda5d0fe5a"
down_revision: str | None = "27041cf0b012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_primary_key("users_pkey", "users", ["user_id"])
    op.create_primary_key("publs_pkey", "publs", ["publ_id"])


def downgrade() -> None:
    op.drop_constraint("users_pkey", "users", type_="primary")
    op.drop_constraint("publs_pkey", "publs", type_="primary")
