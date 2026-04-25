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

    op.alter_column("records", "geo_nn", new_column_name="decimallatitude")
    op.alter_column("records", "geo_ee", new_column_name="decimallongitude")
    op.alter_column(
        "records", "geo_uncert", new_column_name="coordinateuncertaintyinmeters"
    )
    op.add_column("records", sa.Column("verbatimcoordinates", sa.Text(), nullable=True))
    # Leave geo_nn_raw, geo_ee_raw, for easy backward migration

    op.alter_column("records", "geo_origin", new_column_name="georeferencedby")
    op.alter_column("records", "geo_REM", new_column_name="locationremarks")

    # Leave eve_** as is
    op.add_column("records", sa.Column("verbatimeventdate", sa.Text(), nullable=True))

    op.alter_column("records", "eve_day.def", new_column_name="dttm_precision")
    op.add_column("records", sa.Column("dttm_interval", sa.Boolean(), nullable=True))
    op.alter_column("records", "eve_habitat", new_column_name="habitat")
    op.add_column("records", sa.Column("samplingprotocol", sa.Text(), nullable=True))
    op.alter_column("records", "eve_effort", new_column_name="samplingeffort")
    op.add_column("records", sa.Column("samplesizevalue", sa.Float(), nullable=True))
    op.add_column("records", sa.Column("samplesizeunit", sa.Text(), nullable=True))
    op.alter_column("records", "eve_REM", new_column_name="eventremarks")
    op.add_column("records", sa.Column("fieldnumber", sa.Text(), nullable=True))
    op.add_column("records", sa.Column("catalognumber", sa.Text(), nullable=True))
    op.add_column("records", sa.Column("collectioncode", sa.Text(), nullable=True))
    op.alter_column("records", "abu_coll", new_column_name="recordedby")

    op.alter_column("records", "tax_fam", new_column_name="family")
    op.alter_column("records", "tax_gen", new_column_name="genus")
    op.alter_column("records", "tax_sp", new_column_name="specificepithet")
    op.add_column("records", sa.Column("tax_verbatim", sa.Boolean(), nullable=True))
    # tax_sp.def -> taxonrank isn't a column rename because of datatype change
    op.add_column("records", sa.Column("taxonrank", sa.Text(), nullable=True))
    # Leave tax_nsp, type_status as is
    op.add_column("records", sa.Column("acceptednameusage", sa.Text(), nullable=True))
    op.alter_column("records", "tax_REM", new_column_name="taxonremarks")

    # Leave abu as is
    op.add_column("records", sa.Column("organismquantity", sa.Float(), nullable=True))
    op.add_column(
        "records", sa.Column("organismquantitytype", sa.Text(), nullable=True)
    )

    op.add_column("records", sa.Column("sex", sa.Text(), nullable=True))
    op.add_column("records", sa.Column("lifestage", sa.Text(), nullable=True))
    op.add_column("records", sa.Column("occurrenceremarks", sa.Text(), nullable=True))
    op.add_column(
        "records", sa.Column("identificationremarks", sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("records", "identificationremarks")
    op.drop_column("records", "occurrenceremarks")
    op.drop_column("records", "lifestage")
    op.drop_column("records", "sex")
    op.drop_column("records", "organismquantitytype")
    op.drop_column("records", "organismquantity")

    op.alter_column("records", "taxonremarks", new_column_name="tax_REM")
    op.drop_column("records", "acceptednameusage")
    op.drop_column("records", "taxonrank")
    op.drop_column("records", "tax_verbatim")
    op.alter_column("records", "specificepithet", new_column_name="tax_sp")
    op.alter_column("records", "genus", new_column_name="tax_gen")
    op.alter_column("records", "family", new_column_name="tax_fam")

    op.alter_column("records", "recordedby", new_column_name="abu_coll")
    op.drop_column("records", "fieldnumber")
    op.drop_column("records", "collectioncode")
    op.drop_column("records", "catalognumber")
    op.alter_column("records", "eventremarks", new_column_name="eve_REM")
    op.drop_column("records", "samplesizeunit")
    op.drop_column("records", "samplesizevalue")
    op.alter_column("records", "samplingeffort", new_column_name="eve_effort")
    op.drop_column("records", "samplingprotocol")
    op.alter_column("records", "habitat", new_column_name="eve_habitat")
    op.drop_column("records", "dttm_interval")
    op.alter_column("records", "dttm_precision", new_column_name="eve_day.def")
    op.drop_column("records", "verbatimeventdate")

    op.alter_column("records", "locationremarks", new_column_name="geo_REM")
    op.alter_column("records", "georeferencedby", new_column_name="geo_origin")

    op.drop_column("records", "verbatimcoordinates")
    op.alter_column(
        "records", "coordinateuncertaintyinmeters", new_column_name="geo_uncert"
    )
    op.alter_column("records", "decimallongitude", new_column_name="geo_ee")
    op.alter_column("records", "decimallatitude", new_column_name="geo_nn")

    op.alter_column("records", "verbatimlocality", new_column_name="adm_loc")
    op.alter_column("records", "county", new_column_name="adm_district")
    op.alter_column("records", "stateprovince", new_column_name="adm_region")
    op.alter_column("records", "countrycode", new_column_name="adm_country")
