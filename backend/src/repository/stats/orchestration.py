import asyncio
from collections.abc import Awaitable, Callable
from functools import wraps
from types import SimpleNamespace
from typing import TypeVar

from cachetools import TTLCache
from sqlalchemy import func, select
from sqlalchemy.engine import Row
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.enums import RecordType
from core.model import Action, EventRecord, Publication, User, records_table
from repository.stats.counts import (
    avg_user_age,
    count_checks,
    count_failed_records,
    count_families,
    count_genera,
    count_processed_publications,
    count_publications,
    count_species,
    count_total_records,
    count_total_users,
    count_user_publications,
    sum_user_individuals,
)
from repository.stats.top_items import (
    _most_common_year,
    most_common_family,
    most_common_genus,
    most_common_species,
    top_user_species,
)
from schema.common import ProjectStats, UserStats

_project_stats_cache = TTLCache(maxsize=16, ttl=3600)
_user_stats_cache = TTLCache(maxsize=1024, ttl=300)
_bot_general_cache = TTLCache(maxsize=1, ttl=300)
_bot_user_cache = TTLCache(maxsize=1024, ttl=300)

_cache_locks: dict[int, asyncio.Lock] = {}


F = TypeVar("F", bound=Callable[..., Awaitable[object]])


def cached(cache: TTLCache, key: str) -> Callable[[F], F]:
    def decorator(func: F) -> F:
        @wraps(func)
        async def wrapper(*args: object, **kwargs: object) -> object:
            resolved = key.format(*args, **kwargs)

            if (cached_val := cache.get(resolved)) is not None:
                return cached_val

            cache_id = id(cache)
            if cache_id not in _cache_locks:
                _cache_locks[cache_id] = asyncio.Lock()
            async with _cache_locks[cache_id]:
                if (cached_val := cache.get(resolved)) is not None:
                    return cached_val
                result = await func(*args, **kwargs)
                cache[resolved] = result
                return result

        return wrapper  # type: ignore[return-type]  # ty:ignore[invalid-return-type]

    return decorator


def compute_rec_fail_ratio(fail: int, ok: int) -> float | None:
    return round(fail / ok, 2) if ok > 0 else None


def compute_check_ratio(checks: int, records: int) -> float | None:
    return round(checks / records, 1) if records > 0 else None


@cached(_project_stats_cache, "project_stats")
async def get_project_statistics(session: AsyncSession) -> ProjectStats:
    total_volunteers = await count_total_users(session)

    return ProjectStats(
        total_volunteers=total_volunteers,
        total_records=await count_total_records(session),
        species_count=await count_species(session),
        processed_publications_count=await count_processed_publications(session),
        families_count=await count_families(session),
        checks_count=await count_checks(session),
        failed_records=await count_failed_records(session),
        total_users=total_volunteers,
    )


async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    return await session.scalar(select(User).where(User.user_id == user_id))


async def get_user_by_name(session: AsyncSession, name: str) -> User | None:
    return await session.scalar(select(User).where(User.name == name))


@cached(_user_stats_cache, "user_stats:{user_id}")
async def get_user_statistics(session: AsyncSession, user_id: int) -> UserStats:
    distinct_species = await count_species(session, user_id=user_id)

    result: UserStats = {
        "records_entered": await count_total_records(session, user_id=user_id),
        "publications_processed": await count_user_publications(session, user_id),
        "most_common_family": await most_common_family(session, user_id),
        "most_common_genus": await most_common_genus(session, user_id),
        "most_common_species": await most_common_species(session, user_id),
        "top_species": await top_user_species(session, user_id),
        "checks_count": await count_checks(session, user_id=user_id),
        "failed_records": await count_failed_records(session, user_id=user_id),
        "total_individuals": await sum_user_individuals(session, user_id),
        "distinct_families": await count_families(session, user_id=user_id),
        "distinct_genera": await count_genera(session, user_id=user_id),
        "distinct_species": distinct_species,
        "most_common_year": await _most_common_year(session, user_id),
    }
    return result


async def get_volunteers_achievements(session: AsyncSession) -> list[Row]:
    stmt = (
        select(
            Action.user_id,
            Action.object,
            Action.datetime,
            User.name,
            User.tlg_name,
            User.tlg_username,
        )
        .join(User, Action.user_id == User.user_id)
        .where(Action.action.in_(["fau_50", "fau_100"]))
        .order_by(Action.datetime.desc())
    )
    result = await session.execute(stmt)
    return list(result.fetchall())


@cached(_project_stats_cache, "cumulative_volunteers")
async def get_cumulative_volunteers(session: AsyncSession) -> list[Row]:
    stmt = (
        select(
            func.date(User.reg_run).label("date"),
            func.count().label("cnt"),
        )
        .where(User.reg_run.isnot(None))
        .group_by(func.date(User.reg_run))
        .order_by(func.date(User.reg_run))
    )
    result = await session.execute(stmt)
    rows = list(result.fetchall())
    running = 0
    accumulated = []
    for r in rows:
        running += r.cnt
        accumulated.append(SimpleNamespace(date=r.date, cnt=running))
    return accumulated


@cached(_project_stats_cache, "cumulative_records")
async def get_cumulative_records(session: AsyncSession) -> list[Row]:
    er_stmt = (
        select(
            func.date(EventRecord.created_at).label("date"),
            func.count().label("cnt"),
        )
        .where(EventRecord.type == RecordType.REC_OK)
        .group_by(func.date(EventRecord.created_at))
    )
    result = await session.execute(er_stmt)
    per_date: dict[str, int] = {}
    for r in result:
        per_date[r.date] = per_date.get(r.date, 0) + r.cnt

    r_stmt = (
        select(
            func.date(records_table.c.datetime).label("date"),
            func.count().label("cnt"),
        )
        .where(records_table.c.type == "rec_ok")
        .group_by(func.date(records_table.c.datetime))
    )
    legacy_result = await session.execute(r_stmt)
    for r in legacy_result:
        per_date[r.date] = per_date.get(r.date, 0) + r.cnt

    sorted_dates = sorted(per_date.items())
    running = 0
    accumulated = []
    for date, cnt in sorted_dates:
        running += cnt
        accumulated.append(SimpleNamespace(date=date, cnt=running))
    return accumulated


@cached(_project_stats_cache, "progress")
async def get_progress(session: AsyncSession) -> tuple[int, int, int]:
    admin_ids = settings.ADMIN_USER_IDS
    total_stmt = (
        select(func.count())
        .select_from(Publication)
        .where(
            Publication.ural == 1,
            Publication.spec == 1,
            Publication.occs == 1,
        )
    )
    total = await session.scalar(total_stmt) or 0

    eligible_publs = select(Publication.publ_id).where(
        Publication.ural == 1, Publication.spec == 1, Publication.occs == 1
    )

    er_pairs = (
        select(EventRecord.publ_id, EventRecord.user_id)
        .join(Publication, EventRecord.publ_id == Publication.publ_id)
        .where(
            EventRecord.type == RecordType.REC_OK,
            Publication.ural == 1,
            Publication.spec == 1,
            Publication.occs == 1,
            EventRecord.user_id.notin_(admin_ids),
        )
    )
    r_pairs = select(records_table.c.publ_id, records_table.c.user_id).where(
        records_table.c.type == "rec_ok",
        records_table.c.user_id.notin_(admin_ids),
        records_table.c.publ_id.in_(eligible_publs),
    )
    union_pairs = er_pairs.union(r_pairs).subquery()
    rows = await session.execute(
        select(
            union_pairs.c.publ_id,
            func.count(func.distinct(union_pairs.c.user_id)),
        ).group_by(union_pairs.c.publ_id)
    )

    counts = {publ_id: min(cnt, 3) for publ_id, cnt in rows}

    processed = sum(counts.values()) // 3
    fully_processed = sum(1 for v in counts.values() if v >= 3)

    return (total, processed, fully_processed)


@cached(_bot_general_cache, "bot_general_stats")
async def get_bot_general_stats(session: AsyncSession) -> dict:
    rec_ok = await count_total_records(session)
    rec_fail = await count_failed_records(session)
    total_checks = await count_checks(session)

    return {
        "total_users": await count_total_users(session),
        "avg_age": await avg_user_age(session),
        "total_publs": await count_publications(session),
        "rus_publs": await count_publications(session, language="rus"),
        "eng_publs": await count_publications(session, language="eng"),
        "rec_ok": rec_ok,
        "rec_fail_ratio": compute_rec_fail_ratio(rec_fail, rec_ok),
        "check_ratio": compute_check_ratio(total_checks, rec_ok),
        "species_count": await count_species(session),
        "families_count": await count_families(session),
    }


@cached(_bot_user_cache, "bot_user_stats:{user_id}")
async def get_bot_user_stats(session: AsyncSession, user_id: int) -> dict:
    records = await count_total_records(session, user_id=user_id)
    checks = await count_checks(session, user_id=user_id)

    return {
        "processed_publs": await count_user_publications(session, user_id),
        "rec_ok": records,
        "check_ratio": compute_check_ratio(checks, records),
        "species_count": await count_species(session, user_id=user_id),
        "most_common_species": await most_common_species(session, user_id),
    }
