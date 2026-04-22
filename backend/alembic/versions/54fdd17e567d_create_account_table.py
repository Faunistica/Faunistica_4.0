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
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # География
    op.alter_column('spiders', 'country', new_column_name='countrycode')
    op.alter_column('spiders', 'region', new_column_name='stateprovince')
    op.alter_column('spiders', 'district', new_column_name='county')
    op.alter_column('spiders', 'locality', new_column_name='verbatimlocality')
    op.alter_column('spiders', 'latitude', new_column_name='decimallatitude')
    op.alter_column('spiders', 'longitude', new_column_name='decimallongitude')
    op.alter_column('spiders', 'uncertainty', new_column_name='coordinateuncertaintyinmeters')
    op.alter_column('spiders', 'georef_source', new_column_name='georeferencedby')
    op.alter_column('spiders', 'location_remarks', new_column_name='locationremarks')

    # Даты
    op.alter_column('spiders', 'year', new_column_name='eve_YY')
    op.alter_column('spiders', 'month', new_column_name='eve_MM')
    op.alter_column('spiders', 'day', new_column_name='eve_DD')
    op.alter_column('spiders', 'year_end', new_column_name='eve_YY_end')
    op.alter_column('spiders', 'month_end', new_column_name='eve_MM_end')
    op.alter_column('spiders', 'day_end', new_column_name='eve_DD_end')
    op.alter_column('spiders', 'verbatim_date', new_column_name='verbatimeventdate')
    op.alter_column('spiders', 'date_precision', new_column_name='dttm_precision')
    op.alter_column('spiders', 'is_interval', new_column_name='dttm_interval')

    # Сбор и усилия
    op.alter_column('spiders', 'sampling_protocol', new_column_name='samplingprotocol')
    op.alter_column('spiders', 'sampling_effort', new_column_name='samplingeffort')
    op.alter_column('spiders', 'sample_size_value', new_column_name='samplesizevalue')
    op.alter_column('spiders', 'sample_size_unit', new_column_name='samplesizeunit')
    op.alter_column('spiders', 'event_remarks', new_column_name='eventremarks')
    op.alter_column('spiders', 'field_number', new_column_name='fieldnumber')
    op.alter_column('spiders', 'catalog_number', new_column_name='catalognumber')
    op.alter_column('spiders', 'collection_code', new_column_name='collectioncode')
    op.alter_column('spiders', 'recorded_by', new_column_name='recordedby')

    # Таксономия
    op.alter_column('spiders', 'species', new_column_name='specificepithet')
    op.alter_column('spiders', 'taxon_rank', new_column_name='taxonrank')
    op.alter_column('spiders', 'is_new_species', new_column_name='tax_nsp')
    op.alter_column('spiders', 'accepted_name', new_column_name='acceptednameusage')
    op.alter_column('spiders', 'taxon_remarks', new_column_name='taxonremarks')

    # Количество и особь
    op.alter_column('spiders', 'quantity', new_column_name='organismquantity')
    op.alter_column('spiders', 'quantity_type', new_column_name='organismquantitytype')
    op.alter_column('spiders', 'life_stage', new_column_name='lifestage')
    op.alter_column('spiders', 'occurrence_remarks', new_column_name='occurrenceremarks')
    op.alter_column('spiders', 'identification_remarks', new_column_name='identificationremarks')

    op.add_column('spiders', sa.Column('day_defined', sa.Boolean(), nullable=True))

    # индексы
    op.create_index('ix_spiders_user_id', 'spiders', ['user_id'])
    op.create_index('ix_spiders_publ_id', 'spiders', ['publ_id'])
    op.create_index('ix_spiders_type', 'spiders', ['type'])
    op.create_index('ix_spiders_datetime', 'spiders', ['datetime'])


def downgrade() -> None:
    op.drop_index('ix_spiders_datetime', table_name='spiders')
    op.drop_index('ix_spiders_type', table_name='spiders')
    op.drop_index('ix_spiders_publ_id', table_name='spiders')
    op.drop_index('ix_spiders_user_id', table_name='spiders')

    op.drop_column('spiders', 'day_defined')

    # География
    op.alter_column('spiders', 'countrycode', new_column_name='country')
    op.alter_column('spiders', 'stateprovince', new_column_name='region')
    op.alter_column('spiders', 'county', new_column_name='district')
    op.alter_column('spiders', 'verbatimlocality', new_column_name='locality')
    op.alter_column('spiders', 'decimallatitude', new_column_name='latitude')
    op.alter_column('spiders', 'decimallongitude', new_column_name='longitude')
    op.alter_column('spiders', 'coordinateuncertaintyinmeters', new_column_name='uncertainty')
    op.alter_column('spiders', 'georeferencedby', new_column_name='georef_source')
    op.alter_column('spiders', 'locationremarks', new_column_name='location_remarks')

    # Даты
    op.alter_column('spiders', 'eve_YY', new_column_name='year')
    op.alter_column('spiders', 'eve_MM', new_column_name='month')
    op.alter_column('spiders', 'eve_DD', new_column_name='day')
    op.alter_column('spiders', 'eve_YY_end', new_column_name='year_end')
    op.alter_column('spiders', 'eve_MM_end', new_column_name='month_end')
    op.alter_column('spiders', 'eve_DD_end', new_column_name='day_end')
    op.alter_column('spiders', 'verbatimeventdate', new_column_name='verbatim_date')
    op.alter_column('spiders', 'dttm_precision', new_column_name='date_precision')
    op.alter_column('spiders', 'dttm_interval', new_column_name='is_interval')

    # Сбор и усилия
    op.alter_column('spiders', 'samplingprotocol', new_column_name='sampling_protocol')
    op.alter_column('spiders', 'samplingeffort', new_column_name='sampling_effort')
    op.alter_column('spiders', 'samplesizevalue', new_column_name='sample_size_value')
    op.alter_column('spiders', 'samplesizeunit', new_column_name='sample_size_unit')
    op.alter_column('spiders', 'eventremarks', new_column_name='event_remarks')
    op.alter_column('spiders', 'fieldnumber', new_column_name='field_number')
    op.alter_column('spiders', 'catalognumber', new_column_name='catalog_number')
    op.alter_column('spiders', 'collectioncode', new_column_name='collection_code')
    op.alter_column('spiders', 'recordedby', new_column_name='recorded_by')

    # Таксономия
    op.alter_column('spiders', 'specificepithet', new_column_name='species')
    op.alter_column('spiders', 'taxonrank', new_column_name='taxon_rank')
    op.alter_column('spiders', 'tax_nsp', new_column_name='is_new_species')
    op.alter_column('spiders', 'acceptednameusage', new_column_name='accepted_name')
    op.alter_column('spiders', 'taxonremarks', new_column_name='taxon_remarks')

    # Количество и особь
    op.alter_column('spiders', 'organismquantity', new_column_name='quantity')
    op.alter_column('spiders', 'organismquantitytype', new_column_name='quantity_type')
    op.alter_column('spiders', 'lifestage', new_column_name='life_stage')
    op.alter_column('spiders', 'occurrenceremarks', new_column_name='occurrence_remarks')
    op.alter_column('spiders', 'identificationremarks', new_column_name='identification_remarks')