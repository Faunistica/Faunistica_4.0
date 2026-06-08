from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.enums import RecordType
from core.model import (
    Badge, EventRecord, LeaderboardSnapshot, Marathon, User, UserBadge
)


# ---------- значки ----------

async def get_badges_for_user(session: AsyncSession, user_id: int) -> list:
    stmt = (
        select(Badge, UserBadge.awarded_at, UserBadge.marathon_id)
        .join(UserBadge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == user_id)
        .order_by(UserBadge.awarded_at.desc())
    )
    result = await session.execute(stmt)
    return result.all()


async def get_all_active_badges(session: AsyncSession) -> list[Badge]:
    result = await session.execute(
        select(Badge).where(Badge.is_active == True)  # noqa: E712
    )
    return list(result.scalars())


async def award_badge(
    session: AsyncSession, user_id: int, badge_id: int, marathon_id: int | None = None
) -> bool:
    """Выдаёт значок. Возвращает True если выдан впервые, False если уже был."""
    exists = await session.scalar(
        select(UserBadge.id).where(
            UserBadge.user_id == user_id,
            UserBadge.badge_id == badge_id,
            UserBadge.marathon_id == marathon_id,
        )
    )
    if exists:
        return False
    session.add(UserBadge(user_id=user_id, badge_id=badge_id, marathon_id=marathon_id))
    await session.flush()
    return True


async def create_badge(session: AsyncSession, **kwargs) -> Badge:
    badge = Badge(**kwargs)
    session.add(badge)
    await session.flush()
    return badge


# ---------- рейтинг ----------

async def get_leaderboard(
    session: AsyncSession, period: str, limit: int = 50
) -> list:
    stmt = (
        select(
            LeaderboardSnapshot.rank,
            LeaderboardSnapshot.rank_delta,
            LeaderboardSnapshot.user_id,
            LeaderboardSnapshot.record_count,
            User.name,
        )
        .join(User, User.user_id == LeaderboardSnapshot.user_id)
        .where(LeaderboardSnapshot.period == period)
        .order_by(LeaderboardSnapshot.rank)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return result.all()


async def get_user_rank(
    session: AsyncSession, user_id: int, period: str
) -> LeaderboardSnapshot | None:
    return await session.scalar(
        select(LeaderboardSnapshot).where(
            LeaderboardSnapshot.user_id == user_id,
            LeaderboardSnapshot.period == period,
        )
    )


async def refresh_leaderboard(session: AsyncSession, period: str) -> None:
    now = datetime.now(UTC)

    if period == "weekly":
        since = now - timedelta(days=7)
    elif period == "monthly":
        since = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        since = None

    count_q = (
        select(EventRecord.user_id, func.count().label("cnt"))
        .where(EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.user_id)
    )
    if since:
        count_q = count_q.where(EventRecord.created_at >= since)
    counts = (await session.execute(count_q)).all()

    counts_sorted = sorted(counts, key=lambda r: r.cnt, reverse=True)

    old_ranks: dict[int, int] = {}
    old_rows = await session.execute(
        select(LeaderboardSnapshot.user_id, LeaderboardSnapshot.rank).where(
            LeaderboardSnapshot.period == period
        )
    )
    for row in old_rows:
        old_ranks[row.user_id] = row.rank

    await session.execute(
        delete(LeaderboardSnapshot).where(LeaderboardSnapshot.period == period)
    )

    for new_rank, row in enumerate(counts_sorted, start=1):
        old_rank = old_ranks.get(row.user_id)
        delta = (old_rank - new_rank) if old_rank else None
        session.add(
            LeaderboardSnapshot(
                user_id=row.user_id,
                period=period,
                record_count=row.cnt,
                rank=new_rank,
                rank_delta=delta,
                computed_at=now,
            )
        )
    await session.flush()


# ---------- марафоны ----------

async def get_marathons(session: AsyncSession) -> list[Marathon]:
    result = await session.execute(
        select(Marathon).order_by(Marathon.starts_at.desc())
    )
    return list(result.scalars())


async def get_marathon(session: AsyncSession, marathon_id: int) -> Marathon | None:
    return await session.scalar(
        select(Marathon).where(Marathon.id == marathon_id)
    )


async def create_marathon(session: AsyncSession, **kwargs) -> Marathon:
    m = Marathon(**kwargs)
    session.add(m)
    await session.flush()
    return m


async def get_marathon_top(session: AsyncSession, marathon: Marathon) -> list:
    stmt = (
        select(EventRecord.user_id, func.count().label("cnt"), User.name)
        .join(User, User.user_id == EventRecord.user_id)
        .where(
            EventRecord.type == RecordType.REC_OK,
            EventRecord.created_at >= marathon.starts_at,
            EventRecord.created_at <= marathon.ends_at,
        )
        .group_by(EventRecord.user_id, User.name)
        .order_by(func.count().desc())
        .limit(50)
    )
    result = await session.execute(stmt)
    return result.all()


# ---------- карта ----------

async def get_user_map_records(session: AsyncSession, user_id: int) -> list:
    stmt = (
        select(
            EventRecord.id,
            EventRecord.latitude,
            EventRecord.longitude,
            EventRecord.genus,
            EventRecord.species,
            EventRecord.created_at,
        )
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type == RecordType.REC_OK,
            EventRecord.latitude.isnot(None),
            EventRecord.longitude.isnot(None),
        )
        .order_by(EventRecord.created_at.desc())
    )
    result = await session.execute(stmt)
    return result.all()