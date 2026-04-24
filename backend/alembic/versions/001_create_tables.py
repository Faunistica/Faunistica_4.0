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
        'records',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('publ_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('datetime', sa.TIMESTAMP(), nullable=True),
        sa.Column('ip', sa.Text(), nullable=True),
        sa.Column('errors', sa.Text(), nullable=True),
        sa.Column('type', sa.Text(), nullable=True),
        sa.Column('adm_country', sa.Text(), nullable=True),
        sa.Column('adm_region', sa.Text(), nullable=True),
        sa.Column('adm_district', sa.Text(), nullable=True),
        sa.Column('adm_loc', sa.Text(), nullable=True),
        sa.Column('adm_verbatim', sa.Text(), nullable=True),
        sa.Column('geo_nn', sa.Float(), nullable=True),
        sa.Column('geo_ee', sa.Float(), nullable=True),
        sa.Column('geo_nn_raw', sa.Text(), nullable=True),
        sa.Column('geo_ee_raw', sa.Text(), nullable=True),
        sa.Column('geo_origin', sa.Text(), nullable=True),
        sa.Column('geo_REM', sa.Text(), nullable=True),
        sa.Column('geo_uncert', sa.Float(), nullable=True),
        sa.Column('eve_YY', sa.Integer(), nullable=True),
        sa.Column('eve_MM', sa.Integer(), nullable=True),
        sa.Column('eve_DD', sa.Integer(), nullable=True),
        sa.Column('eve_day_def', sa.Boolean(), nullable=True),
        sa.Column('eve_YY_end', sa.Integer(), nullable=True),
        sa.Column('eve_MM_end', sa.Integer(), nullable=True),
        sa.Column('eve_DD_end', sa.Integer(), nullable=True),
        sa.Column('eve_habitat', sa.Text(), nullable=True),
        sa.Column('eve_effort', sa.Text(), nullable=True),
        sa.Column('tax_fam', sa.Text(), nullable=True),
        sa.Column('tax_gen', sa.Text(), nullable=True),
        sa.Column('tax_sp', sa.Text(), nullable=True),
        sa.Column('tax_sp_def', sa.Boolean(), nullable=True),
        sa.Column('tax_nsp', sa.Boolean(), nullable=True),
        sa.Column('type_status', sa.Text(), nullable=True),
        sa.Column('tax_REM', sa.Text(), nullable=True),
        sa.Column('abu', sa.Integer(), nullable=True),
        sa.Column('abu_details', sa.Text(), nullable=True),
        sa.Column('abu_ind_rem', sa.Text(), nullable=True),
    )

    op.create_index('ix_records_user_id', 'records', ['user_id'])
    op.create_index('ix_records_publ_id', 'records', ['publ_id'])


def downgrade() -> None:
    op.drop_index('ix_records_publ_id', table_name='records', if_exists=True)
    op.drop_index('ix_records_user_id', table_name='records', if_exists=True)

    op.drop_table('records')
    op.drop_table('actions')
    op.drop_table('publs')
    op.drop_table('users')