import logging
from types import SimpleNamespace

from cachetools import TTLCache
from sqlalchemy import func, select, union_all
from sqlalchemy.engine import Row
from sqlalchemy.exc import SQLAlchemyError
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

logger = logging.getLogger(__name__)

_project_stats_cache = TTLCache(maxsize=16, ttl=3600)
_user_stats_cache = TTLCache(maxsize=1024, ttl=300)
_bot_general_cache = TTLCache(maxsize=1, ttl=300)
_bot_user_cache = TTLCache(maxsize=1024, ttl=300)


def compute_rec_fail_ratio(fail: int, ok: int) -> float | None:
    return round(fail / ok, 2) if ok > 0 else None


def compute_check_ratio(checks: int, records: int) -> float | None:
    return round(checks / records, 1) if records > 0 else None


async def get_project_statistics(session: AsyncSession) -> ProjectStats:
    if (cached := _project_stats_cache.get("project_stats")) is not None:
        return cached

    total_volunteers = await count_total_users(session)

    result = ProjectStats(
        total_volunteers=total_volunteers,
        total_records=await count_total_records(session),
        species_count=await count_species(session),
        processed_publications_count=await count_processed_publications(session),
        families_count=await count_families(session),
        checks_count=await count_checks(session),
        failed_records=await count_failed_records(session),
        total_users=total_volunteers,
    )
    _project_stats_cache["project_stats"] = result
    return result


async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    return await session.scalar(select(User).where(User.user_id == user_id))


async def get_user_by_name(session: AsyncSession, name: str) -> User | None:
    return await session.scalar(select(User).where(User.name == name))


async def get_user_statistics(session: AsyncSession, user_id: int) -> UserStats:
    key = f"user_stats:{user_id}"
    if (cached := _user_stats_cache.get(key)) is not None:
        return cached

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
    _user_stats_cache[key] = result
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


async def get_cumulative_volunteers(session: AsyncSession) -> list[Row]:
    if (cached := _project_stats_cache.get("cumulative_volunteers")) is not None:
        return cached
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
    _project_stats_cache["cumulative_volunteers"] = accumulated
    return accumulated


async def get_cumulative_records(session: AsyncSession) -> list[Row]:
    if (cached := _project_stats_cache.get("cumulative_records")) is not None:
        return cached
    er_stmt = (
        select(
            func.date(EventRecord.created_at).label("date"),
            func.count().label("cnt"),
        )
        .where(EventRecord.type == RecordType.REC_OK)
        .group_by(func.date(EventRecord.created_at))
    )
    r_stmt = (
        select(
            func.date(records_table.c.datetime).label("date"),
            func.count().label("cnt"),
        )
        .where(records_table.c.type == "rec_ok")
        .group_by(func.date(records_table.c.datetime))
    )
    union_sub = union_all(er_stmt, r_stmt).subquery()
    stmt = (
        select(union_sub.c.date, func.sum(union_sub.c.cnt).label("cnt"))
        .group_by(union_sub.c.date)
        .order_by(union_sub.c.date)
    )
    result = await session.execute(stmt)
    rows = list(result.fetchall())
    running = 0
    accumulated = []
    for r in rows:
        running += r.cnt
        accumulated.append(SimpleNamespace(date=r.date, cnt=running))
    _project_stats_cache["cumulative_records"] = accumulated
    return accumulated


async def get_progress(session: AsyncSession) -> tuple[int, int]:
    if (cached := _project_stats_cache.get("progress")) is not None:
        return cached

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

    rows = await session.execute(
        select(EventRecord.publ_id, func.count(func.distinct(EventRecord.user_id)))
        .join(Publication, EventRecord.publ_id == Publication.publ_id)
        .where(
            EventRecord.type == RecordType.REC_OK,
            Publication.ural == 1,
            Publication.spec == 1,
            Publication.occs == 1,
            EventRecord.user_id.notin_(admin_ids),
        )
        .group_by(EventRecord.publ_id)
    )
    counts: dict[int, int] = {}
    for publ_id, cnt in rows:
        counts[publ_id] = cnt

    try:
        async with session.begin_nested():
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
            for publ_id, cnt in rows:
                counts[publ_id] = cnt
    except SQLAlchemyError:
        logger.warning("Could not query legacy records for progress", exc_info=True)

    for publ_id, value in counts.items():
        counts[publ_id] = min(value, 3)

    processed = sum(counts.values()) // 3

    result = (total, processed)
    _project_stats_cache["progress"] = result
    return result


async def get_bot_general_stats(session: AsyncSession) -> dict:
    if (cached := _bot_general_cache.get("bot_general_stats")) is not None:
        return cached

    rec_ok = await count_total_records(session)
    rec_fail = await count_failed_records(session)
    total_checks = await count_checks(session)

    result = {
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
    _bot_general_cache["bot_general_stats"] = result
    return result


async def get_bot_user_stats(session: AsyncSession, user_id: int) -> dict:
    key = f"bot_user_stats:{user_id}"
    if (cached := _bot_user_cache.get(key)) is not None:
        return cached

    records = await count_total_records(session, user_id=user_id)
    checks = await count_checks(session, user_id=user_id)

    result = {
        "processed_publs": await count_user_publications(session, user_id),
        "rec_ok": records,
        "check_ratio": compute_check_ratio(checks, records),
        "species_count": await count_species(session, user_id=user_id),
        "most_common_species": await most_common_species(session, user_id),
    }
    _bot_user_cache[key] = result
    return result
