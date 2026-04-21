"""upgrade from faunistica 2.0 to current

Revision ID: 9dcd5186f5f8
Revises: 
Create Date: 2026-04-21 22:37:37.641735

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9dcd5186f5f8'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_table('spiders', if_exists=True)

    op.add_column('users', sa.Column('id', sa.BigInteger(), nullable=True))
    op.execute(sa.text("UPDATE users SET id = user_id WHERE id IS NULL"))
    op.alter_column('users', 'id', nullable=False)
    op.create_primary_key('pk_users', 'users', ['id'])

    op.add_column('users', sa.Column('publ_id', sa.Integer(), nullable=True))
    op.alter_column('users', 'comm', existing_type=sa.VARCHAR(), type_=sa.Text(), existing_nullable=True)

    op.drop_column('users', 'user_id')

    op.add_column('actions', sa.Column('id', sa.Integer(), nullable=True))
    op.execute(sa.text("CREATE SEQUENCE IF NOT EXISTS actions_id_seq_new"))
    op.execute(sa.text("UPDATE actions SET id = nextval('actions_id_seq_new') WHERE id IS NULL"))
    op.alter_column('actions', 'id', nullable=False)
    op.create_primary_key('pk_actions', 'actions', ['id'])

    op.execute(sa.text("""
        SELECT setval(
            'actions_id_seq_new',
            COALESCE((SELECT MAX(id) FROM actions), 1),
            true
        )
    """))
    op.execute(sa.text("ALTER TABLE actions ALTER COLUMN id SET DEFAULT nextval('actions_id_seq_new')"))

    op.alter_column('actions', 'user_id', existing_type=sa.BIGINT(), nullable=True)
    op.alter_column('actions', 'action', existing_type=sa.TEXT(), nullable=True)
    op.alter_column('actions', 'datetime', existing_type=postgresql.TIMESTAMP(), nullable=True)

    op.execute(sa.text("""
        UPDATE actions a
        SET user_id = NULL
        WHERE user_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM users u WHERE u.id = a.user_id
          )
    """))
    op.create_foreign_key('fk_actions_user_id_users', 'actions', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.drop_column('actions', 'user_ip')

    op.add_column('publs', sa.Column('id', sa.Integer(), nullable=True))
    op.execute(sa.text("""
        WITH d AS (
            SELECT ctid
            FROM (
                SELECT ctid, publ_id,
                       row_number() OVER (PARTITION BY publ_id ORDER BY ctid) rn
                FROM publs
                WHERE publ_id IS NOT NULL
            ) t
            WHERE t.rn > 1
        )
        UPDATE publs p
        SET publ_id = NULL
        WHERE p.ctid IN (SELECT ctid FROM d)
    """))
    op.execute(sa.text("UPDATE publs SET id = publ_id WHERE publ_id IS NOT NULL"))
    op.execute(sa.text("CREATE SEQUENCE IF NOT EXISTS publs_id_seq_new"))
    op.execute(sa.text("UPDATE publs SET id = nextval('publs_id_seq_new') WHERE id IS NULL"))
    op.alter_column('publs', 'id', nullable=False)
    op.create_primary_key('pk_publs', 'publs', ['id'])

    op.execute(sa.text("""
        SELECT setval(
            'publs_id_seq_new',
            COALESCE((SELECT MAX(id) FROM publs), 1),
            true
        )
    """))
    op.execute(sa.text("ALTER TABLE publs ALTER COLUMN id SET DEFAULT nextval('publs_id_seq_new')"))

    op.alter_column(
        'publs', 'ural',
        existing_type=sa.INTEGER(),
        type_=sa.Boolean(),
        existing_nullable=True,
        postgresql_using='CASE WHEN ural IS NULL THEN NULL WHEN ural = 0 THEN FALSE ELSE TRUE END'
    )
    op.alter_column(
        'publs', 'coords',
        existing_type=sa.INTEGER(),
        type_=sa.Boolean(),
        existing_nullable=True,
        postgresql_using='CASE WHEN coords IS NULL THEN NULL WHEN coords = 0 THEN FALSE ELSE TRUE END'
    )
    op.alter_column(
        'publs', 'occs',
        existing_type=sa.INTEGER(),
        type_=sa.Boolean(),
        existing_nullable=True,
        postgresql_using='CASE WHEN occs IS NULL THEN NULL WHEN occs = 0 THEN FALSE ELSE TRUE END'
    )
    op.alter_column(
        'publs', 'spec',
        existing_type=sa.INTEGER(),
        type_=sa.Boolean(),
        existing_nullable=True,
        postgresql_using='CASE WHEN spec IS NULL THEN NULL WHEN spec = 0 THEN FALSE ELSE TRUE END'
    )

    op.drop_column('publs', 'bib_file')
    op.drop_column('publs', 'arj_file')
    op.drop_column('publs', 'publ_id')
    op.drop_column('publs', 'cover')
    op.drop_column('publs', 'e_author')
    op.drop_column('publs', 'e_name')

    op.add_column('records', sa.Column('id', sa.Integer(), nullable=True))
    op.execute(sa.text("CREATE SEQUENCE IF NOT EXISTS records_id_seq_new"))
    op.execute(sa.text("UPDATE records SET id = nextval('records_id_seq_new') WHERE id IS NULL"))
    op.alter_column('records', 'id', nullable=False)
    op.create_primary_key('pk_records', 'records', ['id'])
    op.execute(sa.text("""
        SELECT setval(
            'records_id_seq_new',
            COALESCE((SELECT MAX(id) FROM records), 1),
            true
        )
    """))
    op.execute(sa.text("ALTER TABLE records ALTER COLUMN id SET DEFAULT nextval('records_id_seq_new')"))

    op.execute(sa.text('ALTER TABLE records RENAME COLUMN "eve_day.def" TO eve_day_def'))
    op.execute(sa.text('ALTER TABLE records RENAME COLUMN "tax_sp.def" TO tax_sp_def'))

    op.alter_column('records', 'geo_nn_raw', existing_type=sa.TEXT(), type_=sa.String(length=255), existing_nullable=True)
    op.alter_column('records', 'geo_ee_raw', existing_type=sa.TEXT(), type_=sa.String(length=255), existing_nullable=True)

    op.alter_column(
        'records', 'eve_YY',
        existing_type=sa.NUMERIC(),
        type_=sa.Integer(),
        existing_nullable=True,
        postgresql_using='CASE WHEN "eve_YY" IS NULL THEN NULL '
                         'WHEN "eve_YY" BETWEEN -2147483648 AND 2147483647 THEN "eve_YY"::integer '
                         'ELSE NULL END'
    )
    op.alter_column(
        'records', 'eve_MM',
        existing_type=sa.NUMERIC(),
        type_=sa.Integer(),
        existing_nullable=True,
        postgresql_using='CASE WHEN "eve_MM" IS NULL THEN NULL '
                         'WHEN "eve_MM" BETWEEN -2147483648 AND 2147483647 THEN "eve_MM"::integer '
                         'ELSE NULL END'
    )
    op.alter_column(
        'records', 'eve_DD',
        existing_type=sa.NUMERIC(),
        type_=sa.Integer(),
        existing_nullable=True,
        postgresql_using='CASE WHEN "eve_DD" IS NULL THEN NULL '
                         'WHEN "eve_DD" BETWEEN -2147483648 AND 2147483647 THEN "eve_DD"::integer '
                         'ELSE NULL END'
    )
    op.alter_column(
        'records', 'eve_YY_end',
        existing_type=sa.NUMERIC(),
        type_=sa.Integer(),
        existing_nullable=True,
        postgresql_using='CASE WHEN "eve_YY_end" IS NULL THEN NULL '
                         'WHEN "eve_YY_end" BETWEEN -2147483648 AND 2147483647 THEN "eve_YY_end"::integer '
                         'ELSE NULL END'
    )
    op.alter_column(
        'records', 'eve_MM_end',
        existing_type=sa.NUMERIC(),
        type_=sa.Integer(),
        existing_nullable=True,
        postgresql_using='CASE WHEN "eve_MM_end" IS NULL THEN NULL '
                         'WHEN "eve_MM_end" BETWEEN -2147483648 AND 2147483647 THEN "eve_MM_end"::integer '
                         'ELSE NULL END'
    )
    op.alter_column(
        'records', 'eve_DD_end',
        existing_type=sa.NUMERIC(),
        type_=sa.Integer(),
        existing_nullable=True,
        postgresql_using='CASE WHEN "eve_DD_end" IS NULL THEN NULL '
                         'WHEN "eve_DD_end" BETWEEN -2147483648 AND 2147483647 THEN "eve_DD_end"::integer '
                         'ELSE NULL END'
    )

    op.execute(sa.text("""
        UPDATE records r
        SET user_id = NULL
        WHERE user_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM users u WHERE u.id = r.user_id
          )
    """))

    op.execute(sa.text("""
        UPDATE records r
        SET publ_id = NULL
        WHERE publ_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM publs p WHERE p.id = r.publ_id
          )
    """))
    op.create_foreign_key('fk_records_publ_id_publs', 'records', 'publs', ['publ_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_records_user_id_users', 'records', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    op.execute(sa.text("""
        UPDATE users u
        SET publ_id = NULL
        WHERE publ_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM publs p WHERE p.id = u.publ_id
          )
    """))
    op.create_foreign_key('fk_users_publ_id_publs', 'users', 'publs', ['publ_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('users', sa.Column('user_id', sa.BIGINT(), autoincrement=False, nullable=True))
    op.drop_constraint(None, 'users', type_='foreignkey')
    op.alter_column('users', 'comm',
               existing_type=sa.Text(),
               type_=sa.VARCHAR(),
               existing_nullable=True)
    op.drop_column('users', 'publ_id')
    op.drop_column('users', 'id')
    op.add_column('records', sa.Column('tax_sp.def', sa.BOOLEAN(), autoincrement=False, nullable=True))
    op.add_column('records', sa.Column('eve_day.def', sa.BOOLEAN(), autoincrement=False, nullable=True))
    op.drop_constraint(None, 'records', type_='foreignkey')
    op.drop_constraint(None, 'records', type_='foreignkey')
    op.alter_column('records', 'adm_verbatim',
               existing_type=sa.Text(),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('records', 'eve_DD_end',
               existing_type=sa.Integer(),
               type_=sa.NUMERIC(),
               existing_nullable=True)
    op.alter_column('records', 'eve_MM_end',
               existing_type=sa.Integer(),
               type_=sa.NUMERIC(),
               existing_nullable=True)
    op.alter_column('records', 'eve_YY_end',
               existing_type=sa.Integer(),
               type_=sa.NUMERIC(),
               existing_nullable=True)
    op.alter_column('records', 'geo_uncert',
               existing_type=sa.Double(),
               type_=sa.NUMERIC(),
               existing_nullable=True)
    op.alter_column('records', 'abu',
               existing_type=sa.Integer(),
               type_=sa.DOUBLE_PRECISION(precision=53),
               existing_nullable=True)
    op.alter_column('records', 'eve_DD',
               existing_type=sa.Integer(),
               type_=sa.NUMERIC(),
               existing_nullable=True)
    op.alter_column('records', 'eve_MM',
               existing_type=sa.Integer(),
               type_=sa.NUMERIC(),
               existing_nullable=True)
    op.alter_column('records', 'eve_YY',
               existing_type=sa.Integer(),
               type_=sa.NUMERIC(),
               existing_nullable=True)
    op.alter_column('records', 'geo_ee_raw',
               existing_type=sa.String(length=255),
               type_=sa.TEXT(),
               existing_nullable=True)
    op.alter_column('records', 'geo_nn_raw',
               existing_type=sa.String(length=255),
               type_=sa.TEXT(),
               existing_nullable=True)
    op.drop_column('records', 'tax_sp_def')
    op.drop_column('records', 'eve_day_def')
    op.drop_column('records', 'id')
    op.add_column('publs', sa.Column('e_name', sa.TEXT(), autoincrement=False, nullable=True))
    op.add_column('publs', sa.Column('e_author', sa.TEXT(), autoincrement=False, nullable=True))
    op.add_column('publs', sa.Column('cover', sa.INTEGER(), server_default=sa.text('0'), autoincrement=False, nullable=True))
    op.add_column('publs', sa.Column('publ_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column('publs', sa.Column('arj_file', sa.TEXT(), autoincrement=False, nullable=True))
    op.add_column('publs', sa.Column('bib_file', sa.TEXT(), autoincrement=False, nullable=True))
    op.alter_column('publs', 'spec',
               existing_type=sa.Boolean(),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('publs', 'occs',
               existing_type=sa.Boolean(),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('publs', 'coords',
               existing_type=sa.Boolean(),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('publs', 'ural',
               existing_type=sa.Boolean(),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.drop_column('publs', 'id')
    op.add_column('actions', sa.Column('user_ip', sa.TEXT(), autoincrement=False, nullable=True))
    op.drop_constraint(None, 'actions', type_='foreignkey')
    op.alter_column('actions', 'datetime',
               existing_type=postgresql.TIMESTAMP(),
               nullable=False)
    op.alter_column('actions', 'action',
               existing_type=sa.TEXT(),
               nullable=False)
    op.alter_column('actions', 'user_id',
               existing_type=sa.BIGINT(),
               nullable=False)
    op.drop_column('actions', 'id')
    op.create_table('spiders',
    sa.Column('RECORD', sa.VARCHAR(length=6), server_default=sa.text("'RECORD'::character varying"), autoincrement=False, nullable=True),
    sa.Column('id', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('type', sa.VARCHAR(length=15), autoincrement=False, nullable=False),
    sa.Column('modified', sa.VARCHAR(length=15), autoincrement=False, nullable=True),
    sa.Column('language', sa.VARCHAR(length=15), autoincrement=False, nullable=True),
    sa.Column('license', sa.VARCHAR(length=15), autoincrement=False, nullable=False),
    sa.Column('rightsholder', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('references', sa.TEXT(), autoincrement=False, nullable=False),
    sa.Column('bibliographiccitation', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('institutionid', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('institutioncode', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('ownerinstitutioncode', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('collectioncode', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('datasetname', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('basisofrecord', sa.VARCHAR(length=20), autoincrement=False, nullable=False),
    sa.Column('dynamicproperties', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('OCCURRENCE', sa.VARCHAR(length=10), server_default=sa.text("'OCCURRENCE'::character varying"), autoincrement=False, nullable=True),
    sa.Column('occurrencestatus', sa.VARCHAR(length=15), autoincrement=False, nullable=False),
    sa.Column('disposition', sa.VARCHAR(length=20), autoincrement=False, nullable=True),
    sa.Column('occurrenceid', sa.TEXT(), autoincrement=False, nullable=False),
    sa.Column('catalognumber', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('recordedby', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('individualcount', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('organismquantity', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('organismquantitytype', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('sex', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('lifestage', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('associatedreferences', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('associatedtaxa', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('establishmentmeans', sa.VARCHAR(length=35), autoincrement=False, nullable=True),
    sa.Column('occurrenceremarks', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('EVENT', sa.VARCHAR(length=5), server_default=sa.text("'EVENT'::character varying"), autoincrement=False, nullable=True),
    sa.Column('eventid', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('parenteventid', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('fieldnumber', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('eventdate', sa.VARCHAR(length=25), autoincrement=False, nullable=True),
    sa.Column('startdayofyear', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('enddayofyear', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('year', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('month', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('day', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('verbatimeventdate', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('habitat', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('samplingprotocol', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('samplingeffort', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('samplesizevalue', sa.REAL(), autoincrement=False, nullable=True),
    sa.Column('samplesizeunit', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('eventremarks', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('LOCATION', sa.VARCHAR(length=10), server_default=sa.text("'LOCATION'::character varying"), autoincrement=False, nullable=True),
    sa.Column('locationid', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('highergeography', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('continent', sa.VARCHAR(length=30), autoincrement=False, nullable=True),
    sa.Column('country', sa.VARCHAR(length=30), autoincrement=False, nullable=True),
    sa.Column('countrycode', sa.VARCHAR(length=3), autoincrement=False, nullable=True),
    sa.Column('stateprovince', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('county', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('municipality', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('locality', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('verbatimlocality', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('minimumelevationinmeters', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('maximumelevationinmeters', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('decimallatitude', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True),
    sa.Column('decimallongitude', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True),
    sa.Column('geodeticdatum', sa.VARCHAR(length=30), autoincrement=False, nullable=True),
    sa.Column('coordinateuncertaintyinmeters', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('coordinateprecision', sa.REAL(), autoincrement=False, nullable=True),
    sa.Column('verbatimcoordinates', sa.VARCHAR(length=50), autoincrement=False, nullable=True),
    sa.Column('georeferencedby', sa.VARCHAR(length=200), autoincrement=False, nullable=True),
    sa.Column('georeferenceddate', sa.VARCHAR(length=10), autoincrement=False, nullable=True),
    sa.Column('locationremarks', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('IDENTIFICATION', sa.VARCHAR(length=15), server_default=sa.text("'IDENTIFICATION'::character varying"), autoincrement=False, nullable=True),
    sa.Column('identifiedby', sa.VARCHAR(length=200), autoincrement=False, nullable=True),
    sa.Column('dateidentified', sa.VARCHAR(length=10), autoincrement=False, nullable=True),
    sa.Column('verbatimidentification', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('identificationremarks', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('TAXON', sa.VARCHAR(length=5), server_default=sa.text("'TAXON'::character varying"), autoincrement=False, nullable=True),
    sa.Column('taxonrank', sa.VARCHAR(length=10), autoincrement=False, nullable=True),
    sa.Column('scientificname', sa.VARCHAR(length=100), autoincrement=False, nullable=False),
    sa.Column('kingdom', sa.VARCHAR(length=10), server_default=sa.text("'Animalia'::character varying"), autoincrement=False, nullable=True),
    sa.Column('phylum', sa.VARCHAR(length=10), server_default=sa.text("'Arthropoda'::character varying"), autoincrement=False, nullable=True),
    sa.Column('class', sa.VARCHAR(length=10), server_default=sa.text("'Arachnida'::character varying"), autoincrement=False, nullable=True),
    sa.Column('order', sa.VARCHAR(length=10), autoincrement=False, nullable=True),
    sa.Column('family', sa.VARCHAR(length=30), autoincrement=False, nullable=True),
    sa.Column('genus', sa.VARCHAR(length=30), autoincrement=False, nullable=True),
    sa.Column('specificepithet', sa.VARCHAR(length=50), autoincrement=False, nullable=True),
    sa.Column('scientificnameauthorship', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('canonicalname', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('acceptednameusage', sa.VARCHAR(length=100), autoincrement=False, nullable=True),
    sa.Column('type_status', sa.VARCHAR(length=30), autoincrement=False, nullable=True),
    sa.Column('taxonremarks', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('REMOVE', sa.VARCHAR(length=6), server_default=sa.text("'REMOVE'::character varying"), autoincrement=False, nullable=True),
    sa.Column('publ_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('vol_ids', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('shortlink', sa.VARCHAR(length=30), autoincrement=False, nullable=False),
    sa.Column('year1', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('year2', sa.INTEGER(), autoincrement=False, nullable=True)
    )
    # ### end Alembic commands ###
