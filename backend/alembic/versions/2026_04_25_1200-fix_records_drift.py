"""fix_records_drift

Revision ID: fix_records_drift
Revises: 34365a0c6a9b
Create Date: 2026-04-25 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "fix_records_drift"
down_revision: str | None = "34365a0c6a9b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("records", sa.Column("id", sa.Integer(), nullable=True))

    op.execute(
        "WITH numbered AS ("
        "  SELECT ctid, "
        "    ROW_NUMBER() OVER (PARTITION BY user_id, publ_id ORDER BY datetime) as rn"
        "  FROM records "
        "  WHERE user_id IS NOT NULL"
        ") "
        "UPDATE records SET id = numbered.rn"
        "   FROM numbered WHERE records.ctid = numbered.ctid"
    )

    op.alter_column("records", "id", nullable=False)

    op.execute(
        "ALTER TABLE records ALTER COLUMN adm_verbatim TYPE boolean USING CASE WHEN adm_verbatim = 1 THEN true ELSE false END"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE records ALTER COLUMN adm_verbatim TYPE integer USING CASE WHEN adm_verbatim THEN 1 ELSE 0 END"
    )

    op.drop_column("records", "id")
