import logging
from collections.abc import Sequence

from cachetools import TTLCache
from sqlalchemy import func, select, union_all
from sqlalchemy.engine import Row
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.enums import RecordType, UserState
from core.model import Action, EventRecord, Publication, User, records_table
from repository.util import _legacy_scalar
from schema.common import ProjectStats, TopSpeciesItem, UserStats

logger = logging.getLogger(__name__)

_project_stats_cache = TTLCache(maxsize=1, ttl=3600)
_user_stats_cache = TTLCache(maxsize=1024, ttl=300)


# ============================================================
# Atomic stat functions (one statistic each, self-contained)
# ============================================================


async def count_total_users(session: AsyncSession) -> int:
    return (
        await session.scalar(
            select(func.count())
            .select_from(User)
            .where(
                (User.reg_stat == UserState.REG_COMPLETED)
                | (User.reg_stat >= UserState.SUPPORT)
            )
        )
        or 0
    )


async def count_total_records(session: AsyncSession, user_id: int | None = None) -> int:
    event_filter = [EventRecord.type == RecordType.REC_OK]
    legacy_filter = [records_table.c.type == RecordType.REC_OK.value]
    if user_id is not None:
        event_filter.append(EventRecord.user_id == user_id)
        legacy_filter.append(records_table.c.user_id == user_id)

    count = (
        await session.scalar(
            select(func.count()).select_from(EventRecord).where(*event_filter)
        )
        or 0
    )
    legacy = await _legacy_scalar(
        session,
        select(func.count()).select_from(records_table).where(*legacy_filter),
        "Could not query legacy records for total_records",
    )
    return count + (legacy or 0)


async def count_failed_records(
    session: AsyncSession, user_id: int | None = None
) -> int:
    event_filter = [EventRecord.type == RecordType.REC_FAIL]
    legacy_filter = [records_table.c.type == RecordType.REC_FAIL.value]
    if user_id is not None:
        event_filter.append(EventRecord.user_id == user_id)
        legacy_filter.append(records_table.c.user_id == user_id)

    count = (
        await session.scalar(
            select(func.count()).select_from(EventRecord).where(*event_filter)
        )
        or 0
    )
    legacy = await _legacy_scalar(
        session,
        select(func.count()).select_from(records_table).where(*legacy_filter),
        "Could not query legacy records for failed_records",
    )
    return count + (legacy or 0)


async def count_checks(session: AsyncSession, user_id: int | None = None) -> int:
    event_filter = [EventRecord.type.in_([RecordType.CHECK_OK, RecordType.CHECK_FAIL])]
    legacy_filter = [records_table.c.type.in_(["check_ok", "check_fail"])]
    if user_id is not None:
        event_filter.append(EventRecord.user_id == user_id)
        legacy_filter.append(records_table.c.user_id == user_id)

    count = (
        await session.scalar(
            select(func.count()).select_from(EventRecord).where(*event_filter)
        )
        or 0
    )
    legacy = await _legacy_scalar(
        session,
        select(func.count()).select_from(records_table).where(*legacy_filter),
        "Could not query legacy records for checks",
    )
    return count + (legacy or 0)


async def count_species(session: AsyncSession, user_id: int | None = None) -> int:
    event_filter = [EventRecord.type == RecordType.REC_OK]
    legacy_filter = [records_table.c.type == RecordType.REC_OK.value]
    if user_id is not None:
        event_filter.append(EventRecord.user_id == user_id)
        legacy_filter.append(records_table.c.user_id == user_id)

    er = select((EventRecord.genus + " " + EventRecord.species).label("name")).where(
        *event_filter
    )
    r = select(
        (records_table.c.tax_gen + " " + records_table.c.tax_sp).label("name")
    ).where(*legacy_filter)
    union_sub = er.union(r).subquery()
    return (
        await _legacy_scalar(
            session,
            select(func.count(func.distinct(union_sub.c.name))),
            "Could not query records for species_count",
        )
        or 0
    )


async def count_families(session: AsyncSession, user_id: int | None = None) -> int:
    event_filter = [EventRecord.type == RecordType.REC_OK]
    legacy_filter = [records_table.c.type == RecordType.REC_OK.value]
    if user_id is not None:
        event_filter.append(EventRecord.user_id == user_id)
        legacy_filter.append(records_table.c.user_id == user_id)

    er = select(EventRecord.family.label("name")).where(*event_filter)
    r = select(records_table.c.tax_fam.label("name")).where(*legacy_filter)
    union_sub = er.union(r).subquery()
    return (
        await _legacy_scalar(
            session,
            select(func.count(func.distinct(union_sub.c.name))),
            "Could not query records for families_count",
        )
        or 0
    )


async def count_genera(session: AsyncSession, user_id: int | None = None) -> int:
    event_filter = [EventRecord.type == RecordType.REC_OK]
    legacy_filter = [records_table.c.type == RecordType.REC_OK.value]
    if user_id is not None:
        event_filter.append(EventRecord.user_id == user_id)
        legacy_filter.append(records_table.c.user_id == user_id)

    er = select(EventRecord.genus.label("name")).where(*event_filter)
    r = select(records_table.c.tax_gen.label("name")).where(*legacy_filter)
    union_sub = er.union(r).subquery()
    return (
        await _legacy_scalar(
            session,
            select(func.count(func.distinct(union_sub.c.name))),
            "Could not query records for genera_count",
        )
        or 0
    )


async def count_processed_publications(session: AsyncSession) -> int:
    return (
        await session.scalar(
            select(func.count(func.distinct(Action.object)))
            .select_from(Action)
            .where(Action.action == "publ_end_full")
        )
        or 0
    )


async def count_publications(session: AsyncSession, language: str | None = None) -> int:
    filter_ = [
        Publication.ural > 0,
        Publication.coords > 0,
        Publication.occs == 1,
    ]
    if language is not None:
        filter_.append(Publication.language == language)

    return (
        await session.scalar(
            select(func.count()).select_from(Publication).where(*filter_)
        )
        or 0
    )


async def avg_user_age(session: AsyncSession) -> float | None:
    avg = await session.scalar(select(func.avg(User.age)))
    return round(avg, 1) if avg is not None else None


async def count_user_publications(session: AsyncSession, user_id: int) -> int:
    er = select(EventRecord.publ_id.label("id")).where(
        EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK
    )
    r = select(records_table.c.publ_id.label("id")).where(
        records_table.c.user_id == user_id, records_table.c.type == "rec_ok"
    )
    union_sub = er.union(r).subquery()
    return (
        await _legacy_scalar(
            session,
            select(func.count(func.distinct(union_sub.c.id))),
            "Could not query records for user publications",
        )
        or 0
    )


async def sum_user_individuals(session: AsyncSession, user_id: int) -> float:
    total = (
        await session.scalar(
            select(func.sum(func.ceil(EventRecord.quantity)))
            .select_from(EventRecord)
            .where(
                EventRecord.user_id == user_id,
                EventRecord.type == RecordType.REC_OK,
                EventRecord.quantity.isnot(None),
            )
        )
        or 0
    )
    legacy = await _legacy_scalar(
        session,
        select(func.sum(records_table.c.abu))
        .select_from(records_table)
        .where(
            records_table.c.user_id == user_id,
            records_table.c.type == "rec_ok",
        ),
        "Could not query legacy records for total_individuals",
    )
    return (total or 0) + (legacy or 0)


async def _most_common_combined(
    session: AsyncSession,
    user_id: int,
    event_col,
    legacy_col,
    event_expr,
    legacy_expr,
    where_extra,
    label: str,
    warning: str,
):
    """Internal: most common value across EventRecord + legacy with EventRecord fallback."""
    primary = await session.scalar(
        select(event_expr)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type == RecordType.REC_OK,
        )
        .group_by(event_col)
        .order_by(func.count().desc())
        .limit(1)
    )

    er = select(event_expr.label(label)).where(
        EventRecord.user_id == user_id,
        EventRecord.type == RecordType.REC_OK,
    )
    r = select(legacy_expr.label(label)).where(
        records_table.c.user_id == user_id,
        records_table.c.type == "rec_ok",
    )
    combined = union_all(er, r).subquery()
    stmt = (
        select(combined.c[label])
        .group_by(combined.c[label])
        .order_by(func.count().desc())
        .limit(1)
    )
    if where_extra:
        stmt = stmt.where(*where_extra)

    combined_result = await _legacy_scalar(session, stmt, warning)
    return combined_result if combined_result is not None else primary


async def most_common_family(session: AsyncSession, user_id: int) -> str | None:
    return await _most_common_combined(
        session,
        user_id,
        event_col=EventRecord.family,
        legacy_col=records_table.c.tax_fam,
        event_expr=EventRecord.family,
        legacy_expr=records_table.c.tax_fam,
        where_extra=[
            EventRecord.family.isnot(None),
            EventRecord.family != "",
        ],
        label="family",
        warning="Could not query legacy records for user most_common_family",
    )


async def most_common_genus(session: AsyncSession, user_id: int) -> str | None:
    return await _most_common_combined(
        session,
        user_id,
        event_col=EventRecord.genus,
        legacy_col=records_table.c.tax_gen,
        event_expr=EventRecord.genus,
        legacy_expr=records_table.c.tax_gen,
        where_extra=[
            EventRecord.genus.isnot(None),
            EventRecord.genus != "",
        ],
        label="genus",
        warning="Could not query legacy records for user most_common_genus",
    )


async def most_common_species(session: AsyncSession, user_id: int) -> str | None:
    event_species = EventRecord.genus + " " + EventRecord.species
    legacy_species = records_table.c.tax_gen + " " + records_table.c.tax_sp
    return await _most_common_combined(
        session,
        user_id,
        event_col=event_species,
        legacy_col=legacy_species,
        event_expr=event_species,
        legacy_expr=legacy_species,
        where_extra=[
            event_species.isnot(None),
            event_species != " ",
        ],
        label="species",
        warning="Could not query legacy records for user most_common_species",
    )


async def _most_common_year(session: AsyncSession, user_id: int) -> int | None:
    primary = await session.scalar(
        select(Publication.year)
        .select_from(EventRecord)
        .join(Publication, EventRecord.publ_id == Publication.publ_id)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type == RecordType.REC_OK,
            Publication.year.isnot(None),
        )
        .group_by(Publication.year)
        .order_by(func.count().desc())
        .limit(1)
    )

    er = (
        select(Publication.year.label("year"))
        .select_from(EventRecord)
        .join(Publication, EventRecord.publ_id == Publication.publ_id)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type == RecordType.REC_OK,
            Publication.year.isnot(None),
        )
    )
    r = select(records_table.c.eve_YY.label("year")).where(
        records_table.c.user_id == user_id,
        records_table.c.type == "rec_ok",
        records_table.c.eve_YY.isnot(None),
    )
    combined = union_all(er, r).subquery()
    year = await _legacy_scalar(
        session,
        select(combined.c.year)
        .where(combined.c.year.isnot(None))
        .group_by(combined.c.year)
        .order_by(func.count().desc())
        .limit(1),
        "Could not query legacy records for user most_common_year",
    )
    return year if year is not None else primary


async def top_user_species(
    session: AsyncSession, user_id: int, limit: int = 4
) -> list[TopSpeciesItem]:
    stmt = (
        select(
            EventRecord.genus,
            EventRecord.species,
            func.count().label("cnt"),
        )
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.genus, EventRecord.species)
        .order_by(func.count().desc())
        .limit(limit)
    )
    rows = (await session.execute(stmt)).all()
    return await _merge_top_species(session, user_id, rows)


# ---- Derived (pure) ----


def compute_rec_fail_ratio(fail: int, ok: int) -> float | None:
    return round(fail / ok, 2) if ok > 0 else None


def compute_check_ratio(checks: int, records: int) -> float | None:
    return round(checks / records, 1) if records > 0 else None


# ============================================================
# Orchestrators (compose atomics + caching)
# ============================================================


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


async def _merge_top_species(
    session: AsyncSession,
    user_id: int,
    rows: Sequence[Row],
) -> list[TopSpeciesItem]:
    try:
        async with session.begin_nested():
            result = await session.execute(
                select(
                    records_table.c.tax_gen,
                    records_table.c.tax_sp,
                    func.count().label("cnt"),
                )
                .where(
                    records_table.c.user_id == user_id,
                    records_table.c.type == "rec_ok",
                )
                .group_by(records_table.c.tax_gen, records_table.c.tax_sp)
                .order_by(func.count().desc())
                .limit(4)
            )
        legacy_top = {(r.tax_gen, r.tax_sp): r.cnt for r in result.fetchall()}
        species_counts: dict[tuple[str | None, str | None], int] = {}
        for r in rows:
            key = (r.genus, r.species)
            species_counts[key] = species_counts.get(key, 0) + r.cnt
        for (g, s), c in legacy_top.items():
            species_counts[(g, s)] = species_counts.get((g, s), 0) + c
        top_sorted = sorted(species_counts.items(), key=lambda x: -x[1])[:4]
        return [
            TopSpeciesItem(species=f"{g} {s}".strip(), count=c)
            for (g, s), c in top_sorted
        ]
    except SQLAlchemyError:
        return [
            TopSpeciesItem(species=f"{r.genus} {r.species}".strip(), count=r.cnt)
            for r in rows
        ]


async def get_user_statistics(session: AsyncSession, user_id: int) -> UserStats:
    key = f"user_stats:{user_id}"
    if (cached := _user_stats_cache.get(key)) is not None:
        return cached

    # distinct_species uses just species epithet (preserving existing behavior)
    er = select(EventRecord.species.label("name")).where(
        EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK
    )
    r = select(
        (records_table.c.tax_gen + " " + records_table.c.tax_sp).label("name")
    ).where(records_table.c.user_id == user_id, records_table.c.type == "rec_ok")
    union_sub = er.union(r).subquery()
    distinct_species = (
        await session.scalar(select(func.count(func.distinct(union_sub.c.name)))) or 0
    )

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
    _project_stats_cache["cumulative_volunteers"] = rows
    return rows


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
    _project_stats_cache["cumulative_records"] = rows
    return rows


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
