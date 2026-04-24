"""create account table

Revision ID: 54fdd17e567d
Revises: 
Create Date: 2026-04-14 17:04:22.555932

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '54fdd17e567d'
down_revision: Union[str, None] = '001_create_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # География
    op.alter_column('records', 'country', new_column_name='countrycode')
    op.alter_column('records', 'region', new_column_name='stateprovince')
    op.alter_column('records', 'district', new_column_name='county')
    op.alter_column('records', 'locality', new_column_name='verbatimlocality')
    op.alter_column('records', 'latitude', new_column_name='decimallatitude')
    op.alter_column('records', 'longitude', new_column_name='decimallongitude')
    op.alter_column('records', 'uncertainty', new_column_name='coordinateuncertaintyinmeters')
    op.alter_column('records', 'georef_source', new_column_name='georeferencedby')
    op.alter_column('records', 'location_remarks', new_column_name='locationremarks')

    # Даты
    op.alter_column('records', 'year', new_column_name='eve_YY')
    op.alter_column('records', 'month', new_column_name='eve_MM')
    op.alter_column('records', 'day', new_column_name='eve_DD')
    op.alter_column('records', 'year_end', new_column_name='eve_YY_end')
    op.alter_column('records', 'month_end', new_column_name='eve_MM_end')
    op.alter_column('records', 'day_end', new_column_name='eve_DD_end')
    op.alter_column('records', 'verbatim_date', new_column_name='verbatimeventdate')
    op.alter_column('records', 'date_precision', new_column_name='dttm_precision')
    op.alter_column('records', 'is_interval', new_column_name='dttm_interval')

    # Сбор и усилия
    op.alter_column('records', 'sampling_protocol', new_column_name='samplingprotocol')
    op.alter_column('records', 'sampling_effort', new_column_name='samplingeffort')
    op.alter_column('records', 'sample_size_value', new_column_name='samplesizevalue')
    op.alter_column('records', 'sample_size_unit', new_column_name='samplesizeunit')
    op.alter_column('records', 'event_remarks', new_column_name='eventremarks')
    op.alter_column('records', 'field_number', new_column_name='fieldnumber')
    op.alter_column('records', 'catalog_number', new_column_name='catalognumber')
    op.alter_column('records', 'collection_code', new_column_name='collectioncode')
    op.alter_column('records', 'recorded_by', new_column_name='recordedby')

    # Таксономия
    op.alter_column('records', 'species', new_column_name='specificepithet')
    op.alter_column('records', 'taxon_rank', new_column_name='taxonrank')
    op.alter_column('records', 'is_new_species', new_column_name='tax_nsp')
    op.alter_column('records', 'accepted_name', new_column_name='acceptednameusage')
    op.alter_column('records', 'taxon_remarks', new_column_name='taxonremarks')

    # Количество и особь
    op.alter_column('records', 'quantity', new_column_name='organismquantity')
    op.alter_column('records', 'quantity_type', new_column_name='organismquantitytype')
    op.alter_column('records', 'life_stage', new_column_name='lifestage')
    op.alter_column('records', 'occurrence_remarks', new_column_name='occurrenceremarks')
    op.alter_column('records', 'identification_remarks', new_column_name='identificationremarks')

    op.add_column('records', sa.Column('day_defined', sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column('records', 'day_defined')

    # География
    op.alter_column('records', 'countrycode', new_column_name='country')
    op.alter_column('records', 'stateprovince', new_column_name='region')
    op.alter_column('records', 'county', new_column_name='district')
    op.alter_column('records', 'verbatimlocality', new_column_name='locality')
    op.alter_column('records', 'decimallatitude', new_column_name='latitude')
    op.alter_column('records', 'decimallongitude', new_column_name='longitude')
    op.alter_column('records', 'coordinateuncertaintyinmeters', new_column_name='uncertainty')
    op.alter_column('records', 'georeferencedby', new_column_name='georef_source')
    op.alter_column('records', 'locationremarks', new_column_name='location_remarks')

    # Даты
    op.alter_column('records', 'eve_YY', new_column_name='year')
    op.alter_column('records', 'eve_MM', new_column_name='month')
    op.alter_column('records', 'eve_DD', new_column_name='day')
    op.alter_column('records', 'eve_YY_end', new_column_name='year_end')
    op.alter_column('records', 'eve_MM_end', new_column_name='month_end')
    op.alter_column('records', 'eve_DD_end', new_column_name='day_end')
    op.alter_column('records', 'verbatimeventdate', new_column_name='verbatim_date')
    op.alter_column('records', 'dttm_precision', new_column_name='date_precision')
    op.alter_column('records', 'dttm_interval', new_column_name='is_interval')

    # Сбор и усилия
    op.alter_column('records', 'samplingprotocol', new_column_name='sampling_protocol')
    op.alter_column('records', 'samplingeffort', new_column_name='sampling_effort')
    op.alter_column('records', 'samplesizevalue', new_column_name='sample_size_value')
    op.alter_column('records', 'samplesizeunit', new_column_name='sample_size_unit')
    op.alter_column('records', 'eventremarks', new_column_name='event_remarks')
    op.alter_column('records', 'fieldnumber', new_column_name='field_number')
    op.alter_column('records', 'catalognumber', new_column_name='catalog_number')
    op.alter_column('records', 'collectioncode', new_column_name='collection_code')
    op.alter_column('records', 'recordedby', new_column_name='recorded_by')

    # Таксономия
    op.alter_column('records', 'specificepithet', new_column_name='species')
    op.alter_column('records', 'taxonrank', new_column_name='taxon_rank')
    op.alter_column('records', 'tax_nsp', new_column_name='is_new_species')
    op.alter_column('records', 'acceptednameusage', new_column_name='accepted_name')
    op.alter_column('records', 'taxonremarks', new_column_name='taxon_remarks')

    # Количество и особь
    op.alter_column('records', 'organismquantity', new_column_name='quantity')
    op.alter_column('records', 'organismquantitytype', new_column_name='quantity_type')
    op.alter_column('records', 'lifestage', new_column_name='life_stage')
    op.alter_column('records', 'occurrenceremarks', new_column_name='occurrence_remarks')
    op.alter_column('records', 'identificationremarks', new_column_name='identification_remarks')