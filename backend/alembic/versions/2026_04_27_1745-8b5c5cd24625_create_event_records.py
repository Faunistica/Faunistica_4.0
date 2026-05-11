"""create_event_records

Revision ID: 8b5c5cd24625
Revises: d9dda5d0fe5a
Create Date: 2026-04-27 17:45:54.873155

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID

from alembic import op

revision: str = "8b5c5cd24625"
down_revision: str | None = "d9dda5d0fe5a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "event_records",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("publ_id", sa.Integer(), nullable=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("datetime", TIMESTAMP(precision=6), nullable=True),
        sa.Column("updated_at", TIMESTAMP(precision=6), nullable=True),
        sa.Column("ip", sa.Text(), nullable=True),
        sa.Column("errors", sa.Text(), nullable=True),
        sa.Column("type", sa.Text(), nullable=True),
        sa.Column("countrycode", sa.Text(), nullable=True),
        sa.Column("stateprovince", sa.Text(), nullable=True),
        sa.Column("county", sa.Text(), nullable=True),
        sa.Column("verbatimlocality", sa.Text(), nullable=True),
        sa.Column("adm_verbatim", sa.Boolean(), nullable=True),
        sa.Column("decimallatitude", sa.Text(), nullable=True),
        sa.Column("decimallongitude", sa.Text(), nullable=True),
        sa.Column("verbatimcoordinates", sa.Text(), nullable=True),
        sa.Column("coordinateuncertaintyinmeters", sa.Numeric(), nullable=True),
        sa.Column("georeferencedby", sa.Text(), nullable=True),
        sa.Column("locationremarks", sa.Text(), nullable=True),
        sa.Column("verbatimeventdate", sa.Text(), nullable=True),
        sa.Column("dttm_precision", sa.Text(), nullable=True),
        sa.Column("dttm_interval", sa.Boolean(), nullable=True),
        sa.Column("habitat", sa.Text(), nullable=True),
        sa.Column("samplingprotocol", sa.Text(), nullable=True),
        sa.Column("samplingeffort", sa.Text(), nullable=True),
        sa.Column("samplesizevalue", sa.Float(), nullable=True),
        sa.Column("samplesizeunit", sa.Text(), nullable=True),
        sa.Column("eventremarks", sa.Text(), nullable=True),
        sa.Column("fieldnumber", sa.Text(), nullable=True),
        sa.Column("catalognumber", sa.Text(), nullable=True),
        sa.Column("collectioncode", sa.Text(), nullable=True),
        sa.Column("recordedby", sa.Text(), nullable=True),
        sa.Column("family", sa.Text(), nullable=True),
        sa.Column("genus", sa.Text(), nullable=True),
        sa.Column("specificepithet", sa.Text(), nullable=True),
        sa.Column("tax_verbatim", sa.Boolean(), nullable=True),
        sa.Column("taxonrank", sa.Text(), nullable=True),
        sa.Column("type_status", sa.Text(), nullable=True),
        sa.Column("acceptednameusage", sa.Text(), nullable=True),
        sa.Column("taxonremarks", sa.Text(), nullable=True),
        sa.Column("organismquantity", sa.Float(), nullable=True),
        sa.Column("organismquantitytype", sa.Text(), nullable=True),
        sa.Column("sex", sa.Text(), nullable=True),
        sa.Column("lifestage", sa.Text(), nullable=True),
        sa.Column("occurrenceremarks", sa.Text(), nullable=True),
        sa.Column("identificationremarks", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["publ_id"], ["publs.publ_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_table("event_records")
