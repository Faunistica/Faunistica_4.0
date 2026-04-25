"""rename_columns

Revision ID: 34365a0c6a9b
Revises: 27041cf0b012
Create Date: 2026-04-24 21:10:20.487911

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "34365a0c6a9b"
down_revision: str | None = "27041cf0b012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("records", "adm_country", new_column_name="countrycode")
    op.alter_column("records", "adm_region", new_column_name="stateprovince")
    op.alter_column("records", "adm_district", new_column_name="county")
    op.alter_column("records", "adm_loc", new_column_name="verbatimlocality")
    op.alter_column(
        "records",
        "adm_verbatim",
        new_column_name="is_manual_location",
        type_=sa.Boolean(),
        postgresql_using="adm_verbatim::boolean",
    )

    op.alter_column("records", "geo_nn", new_column_name="decimallatitude")
    op.alter_column("records", "geo_ee", new_column_name="decimallongitude")
    op.alter_column("records", "geo_ee_raw", new_column_name="decimallongitude_raw")
    op.alter_column("records", "geo_nn_raw", new_column_name="decimallatitude_raw")
    op.alter_column("records", "geo_origin", new_column_name="georeferencedby")
    op.alter_column("records", "geo_REM", new_column_name="locationremarks")
    op.alter_column(
        "records", "geo_uncert", new_column_name="coordinateuncertaintyinmeters"
    )

    op.alter_column("records", "eve_day.def", new_column_name="day_defined")
    op.alter_column("records", "eve_effort", new_column_name="samplingprotocol")

    op.alter_column("records", "tax_sp", new_column_name="specificepithet")
    op.alter_column("records", "tax_REM", new_column_name="taxonremarks")

    op.alter_column("records", "abu", new_column_name="organismquantity")
    op.alter_column("records", "abu_coll", new_column_name="fieldnumber")

    op.add_column("records", sa.Column("dttm_precision", sa.Text(), nullable=True))
    op.add_column("records", sa.Column("dttm_interval", sa.Boolean(), nullable=True))
    op.add_column("records", sa.Column("samplingeffort", sa.Text(), nullable=True))
    op.add_column("records", sa.Column("samplesizevalue", sa.Float(), nullable=True))
    op.add_column("records", sa.Column("samplesizeunit", sa.Text(), nullable=True))
    op.add_column("records", sa.Column("eventremarks", sa.Text(), nullable=True))
    op.add_column("records", sa.Column("catalognumber", sa.Text(), nullable=True))
    op.add_column("records", sa.Column("collectioncode", sa.Text(), nullable=True))
    op.add_column("records", sa.Column("recordedby", sa.Text(), nullable=True))
    op.add_column("records", sa.Column("verbatimeventdate", sa.Text(), nullable=True))
    op.add_column("records", sa.Column("taxonrank", sa.Boolean(), nullable=True))
    op.add_column("records", sa.Column("acceptednameusage", sa.Text(), nullable=True))
    op.add_column(
        "records", sa.Column("organismquantitytype", sa.Text(), nullable=True)
    )
    op.add_column("records", sa.Column("lifestage", sa.Text(), nullable=True))
    op.add_column("records", sa.Column("occurrenceremarks", sa.Text(), nullable=True))
    op.add_column(
        "records", sa.Column("identificationremarks", sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("records", "identificationremarks")
    op.drop_column("records", "occurrenceremarks")
    op.drop_column("records", "lifestage")
    op.drop_column("records", "organismquantitytype")
    op.drop_column("records", "acceptednameusage")
    op.drop_column("records", "taxonrank")
    op.drop_column("records", "verbatimeventdate")
    op.drop_column("records", "recordedby")
    op.drop_column("records", "collectioncode")
    op.drop_column("records", "catalognumber")
    op.drop_column("records", "eventremarks")
    op.drop_column("records", "samplesizeunit")
    op.drop_column("records", "samplesizevalue")
    op.drop_column("records", "samplingeffort")
    op.drop_column("records", "dttm_interval")
    op.drop_column("records", "dttm_precision")

    op.alter_column("records", "fieldnumber", new_column_name="abu_coll")
    op.alter_column("records", "organismquantity", new_column_name="abu")

    op.alter_column("records", "taxonremarks", new_column_name="tax_REM")
    op.alter_column("records", "specificepithet", new_column_name="tax_sp")

    op.alter_column("records", "samplingprotocol", new_column_name="eve_effort")

    op.alter_column("records", "day_defined", new_column_name="eve_day.def")
    op.alter_column(
        "records", "coordinateuncertaintyinmeters", new_column_name="geo_uncert"
    )
    op.alter_column("records", "locationremarks", new_column_name="geo_REM")
    op.alter_column("records", "georeferencedby", new_column_name="geo_origin")
    op.alter_column("records", "decimallongitude", new_column_name="geo_ee")
    op.alter_column("records", "decimallatitude", new_column_name="geo_nn")
    op.alter_column("records", "decimallongitude_raw", new_column_name="geo_ee_raw")
    op.alter_column("records", "decimallatitude_raw", new_column_name="geo_nn_raw")

    op.alter_column("records", "verbatimlocality", new_column_name="adm_loc")
    op.alter_column(
        "records",
        "is_manual_location",
        new_column_name="adm_verbatim",
        type_=sa.Integer(),
        postgresql_using="is_manual_location::integer",
    )
    op.alter_column("records", "county", new_column_name="adm_district")
    op.alter_column("records", "stateprovince", new_column_name="adm_region")
    op.alter_column("records", "countrycode", new_column_name="adm_country")
