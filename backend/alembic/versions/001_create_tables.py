"""create initial tables

Revision ID: 001_create_tables
Revises: 
Create Date: 2026-04-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '001_create_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.BigInteger(), primary_key=True),
        sa.Column('publ_id', sa.Integer(), nullable=True),
        sa.Column('tlg_name', sa.String(255), nullable=True),
        sa.Column('tlg_username', sa.String(255), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('reg_stat', sa.Integer(), nullable=True),
        sa.Column('hash', sa.String(255), nullable=True),
        sa.Column('hash_date', sa.TIMESTAMP(), nullable=True),
        sa.Column('items', sa.Text(), nullable=False),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('lng', sa.String(), nullable=True),
        sa.Column('comm', sa.Text(), nullable=True),
        sa.Column('reg_run', sa.TIMESTAMP(), nullable=True),
        sa.Column('reg_end', sa.TIMESTAMP(), nullable=True),
        sa.Column('sex', sa.String(3), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('email', sa.Text(), nullable=True),
        sa.Column('region', sa.Text(), nullable=True),
    )

    op.create_table(
        'publs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('type', sa.Text(), nullable=True),
        sa.Column('author', sa.Text(), nullable=True),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('name', sa.Text(), nullable=True),
        sa.Column('external', sa.Text(), nullable=True),
        sa.Column('language', sa.Text(), nullable=True),
        sa.Column('resume', sa.Text(), nullable=True),
        sa.Column('ural', sa.Boolean(), nullable=True),
        sa.Column('coords', sa.Boolean(), nullable=True),
        sa.Column('occs', sa.Boolean(), nullable=True),
        sa.Column('spec', sa.Boolean(), nullable=True),
        sa.Column('pdf_file', sa.Text(), nullable=True),
    )

    op.create_table(
        'actions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('action', sa.Text(), nullable=True),
        sa.Column('object', sa.Text(), nullable=True),
        sa.Column('datetime', sa.TIMESTAMP(), nullable=True),
    )

    op.create_table(
        'spiders',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('publ_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('datetime', sa.TIMESTAMP(), nullable=True),
        sa.Column('ip', sa.Text(), nullable=True),
        sa.Column('errors', sa.Text(), nullable=True),
        sa.Column('type', sa.Text(), nullable=True),
        sa.Column('country', sa.Text(), nullable=True),
        sa.Column('region', sa.Text(), nullable=True),
        sa.Column('district', sa.Text(), nullable=True),
        sa.Column('locality', sa.Text(), nullable=True),
        sa.Column('adm_verbatim', sa.Text(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('uncertainty', sa.Float(), nullable=True),
        sa.Column('verbatimlatitude', sa.String(255), nullable=True),
        sa.Column('verbatimlongitude', sa.String(255), nullable=True),
        sa.Column('georef_source', sa.Text(), nullable=True),
        sa.Column('location_remarks', sa.Text(), nullable=True),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('month', sa.Integer(), nullable=True),
        sa.Column('day', sa.Integer(), nullable=True),
        sa.Column('year_end', sa.Integer(), nullable=True),
        sa.Column('month_end', sa.Integer(), nullable=True),
        sa.Column('day_end', sa.Integer(), nullable=True),
        sa.Column('verbatim_date', sa.Text(), nullable=True),
        sa.Column('date_precision', sa.Text(), nullable=True),
        sa.Column('is_interval', sa.Boolean(), nullable=True),
        sa.Column('habitat', sa.Text(), nullable=True),
        sa.Column('sampling_protocol', sa.Text(), nullable=True),
        sa.Column('sampling_effort', sa.Text(), nullable=True),
        sa.Column('sample_size_value', sa.Float(), nullable=True),
        sa.Column('sample_size_unit', sa.Text(), nullable=True),
        sa.Column('event_remarks', sa.Text(), nullable=True),
        sa.Column('field_number', sa.Text(), nullable=True),
        sa.Column('catalog_number', sa.Text(), nullable=True),
        sa.Column('collection_code', sa.Text(), nullable=True),
        sa.Column('recorded_by', sa.Text(), nullable=True),
        sa.Column('family', sa.Text(), nullable=True),
        sa.Column('genus', sa.Text(), nullable=True),
        sa.Column('species', sa.Text(), nullable=True),
        sa.Column('tax_verbatim', sa.Boolean(), nullable=True),
        sa.Column('taxon_rank', sa.Text(), nullable=True),
        sa.Column('is_new_species', sa.Boolean(), nullable=True),
        sa.Column('type_status', sa.Text(), nullable=True),
        sa.Column('accepted_name', sa.Text(), nullable=True),
        sa.Column('taxon_remarks', sa.Text(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=True),
        sa.Column('quantity_type', sa.Text(), nullable=True),
        sa.Column('sex', sa.Text(), nullable=True),
        sa.Column('life_stage', sa.Text(), nullable=True),
        sa.Column('occurrence_remarks', sa.Text(), nullable=True),
        sa.Column('identification_remarks', sa.Text(), nullable=True),
        sa.Column('abu_details', sa.Text(), nullable=True),
        sa.Column('abu_ind_rem', sa.Text(), nullable=True),
    )

    op.create_index('ix_spiders_user_id', 'spiders', ['user_id'])
    op.create_index('ix_spiders_publ_id', 'spiders', ['publ_id'])
    op.create_index('ix_spiders_type', 'spiders', ['type'])
    op.create_index('ix_spiders_datetime', 'spiders', ['datetime'])


def downgrade() -> None:
    op.drop_index('ix_spiders_datetime', table_name='spiders')
    op.drop_index('ix_spiders_type', table_name='spiders')
    op.drop_index('ix_spiders_publ_id', table_name='spiders')
    op.drop_index('ix_spiders_user_id', table_name='spiders')

    op.drop_table('spiders')
    op.drop_table('actions')
    op.drop_table('publs')
    op.drop_table('users')