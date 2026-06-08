"""create_gamification_tables

Revision ID: a1b2c3d4e5f6
Revises: e81c775456a5
Create Date: 2026-06-04 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TIMESTAMP

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "e81c775456a5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "badges",
        sa.Column("id", sa.Integer(), sa.Identity(start=1), nullable=False),
        sa.Column("badge_type", sa.String(32), nullable=False,
            comment="record_count | thematic | marathon_participant | marathon_winner"),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("record_threshold", sa.Integer(), nullable=True),
        sa.Column("conditions", sa.JSON(), nullable=True),
        sa.Column("created_at", TIMESTAMP(), nullable=False, server_default=sa.func.now()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.PrimaryKeyConstraint("id"),
        if_not_exists=True,
    )

    op.create_table(
        "user_badges",
        sa.Column("id", sa.Integer(), sa.Identity(start=1), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("badge_id", sa.Integer(), nullable=False),
        sa.Column("awarded_at", TIMESTAMP(), nullable=False, server_default=sa.func.now()),
        sa.Column("marathon_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["badge_id"], ["badges.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "badge_id", "marathon_id", name="uq_user_badge_marathon"),
        if_not_exists=True,
    )
    op.create_index("ix_user_badges_user_id", "user_badges", ["user_id"])

    op.create_table(
        "marathons",
        sa.Column("id", sa.Integer(), sa.Identity(start=1), nullable=False),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("starts_at", TIMESTAMP(), nullable=False),
        sa.Column("ends_at", TIMESTAMP(), nullable=False),
        sa.Column("rules", sa.JSON(), nullable=True),
        sa.Column("created_at", TIMESTAMP(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        if_not_exists=True,
    )

    op.create_table(
        "leaderboard_snapshots",
        sa.Column("id", sa.Integer(), sa.Identity(start=1), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("period", sa.String(16), nullable=False),
        sa.Column("record_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("rank_delta", sa.Integer(), nullable=True),
        sa.Column("computed_at", TIMESTAMP(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        if_not_exists=True,
    )
    op.create_index("ix_leaderboard_period_rank", "leaderboard_snapshots", ["period", "rank"])
    op.create_index("ix_leaderboard_user_period", "leaderboard_snapshots", ["user_id", "period"])

    op.execute("""
        INSERT INTO badges (badge_type, name, description, record_threshold, is_active)
        VALUES
            ('record_count', 'Головастик',    'Первые 10 записей',  10,   true),
            ('record_count', 'Лягушонок',     '50 записей',         50,   true),
            ('record_count', 'Мангуст',       '100 записей',        100,  true),
            ('record_count', 'Следопыт',      '500 записей',        500,  true),
            ('record_count', 'Исследователь', '1000 записей',       1000, true),
            ('record_count', 'Легенда',       '5000 записей',       5000, true)
        ON CONFLICT DO NOTHING
    """)

    op.execute("""
        INSERT INTO badges (badge_type, name, description, conditions, is_active)
        VALUES
            ('thematic', 'Красный',  'Находки красноокрашенных видов',
             '{"keywords": ["red", "rubens", "coccineus", "rufus"], "field": "species", "min_count": 5}',
             true),
            ('thematic', 'Ядовитый', 'Находки ядовитых видов',
             '{"keywords": ["Latrodectus", "Loxosceles", "Atrax"], "field": "genus", "min_count": 3}',
             true),
            ('thematic', 'Летающий', 'Виды с аэронавтическим поведением',
             '{"keywords": ["balloon", "gossamer"], "field": "occurrenceremarks", "min_count": 3}',
             true)
        ON CONFLICT DO NOTHING
    """)


def downgrade() -> None:
    op.drop_index("ix_leaderboard_user_period", "leaderboard_snapshots")
    op.drop_index("ix_leaderboard_period_rank", "leaderboard_snapshots")
    op.drop_table("leaderboard_snapshots")
    op.drop_index("ix_user_badges_user_id", "user_badges")
    op.drop_table("user_badges")
    op.drop_table("marathons")
    op.drop_table("badges")