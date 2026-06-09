import logging

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


async def get_project_statistics(session: AsyncSession) -> ProjectStats:
    if (cached := _project_stats_cache.get("project_stats")) is not None:
        return cached

    total_volunteers = await session.scalar(
        select(func.count())
        .select_from(User)
        .where(
            (User.reg_stat == UserState.REG_COMPLETED)
            | (User.reg_stat >= UserState.SUPPORT)
        )
    )

    total_records = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_OK)
    )
    try:
        async with session.begin_nested():
            result = await session.scalar(
                select(func.count())
                .select_from(records_table)
                .where(records_table.c.type == "rec_ok")
            )
        total_records = (total_records or 0) + (result or 0)
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records table for total_records", exc_info=True
        )

    species_count = await session.scalar(
        select(func.count(func.distinct(EventRecord.genus + " " + EventRecord.species)))
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_OK)
    )
    try:
        async with session.begin_nested():
            result = await session.scalar(
                select(
                    func.count(
                        func.distinct(
                            records_table.c.tax_gen + " " + records_table.c.tax_sp
                        )
                    )
                )
                .select_from(records_table)
                .where(records_table.c.type == "rec_ok")
            )
        species_count = (species_count or 0) + (result or 0)
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for species_count", exc_info=True
        )

    processed_publications = await session.scalar(
        select(func.count(func.distinct(Action.object)))
        .select_from(Action)
        .where(Action.action == "publ_end_full")
    )

    families_count = await session.scalar(
        select(func.count(func.distinct(EventRecord.family)))
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_OK)
    )
    try:
        async with session.begin_nested():
            result = await session.scalar(
                select(func.count(func.distinct(records_table.c.tax_fam)))
                .select_from(records_table)
                .where(records_table.c.type == "rec_ok")
            )
        families_count = (families_count or 0) + (result or 0)
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for families_count", exc_info=True
        )

    checks_count = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type.in_([RecordType.CHECK_OK, RecordType.CHECK_FAIL]))
    )
    try:
        async with session.begin_nested():
            result = await session.scalar(
                select(func.count())
                .select_from(records_table)
                .where(records_table.c.type.in_(["check_ok", "check_fail"]))
            )
        checks_count = (checks_count or 0) + (result or 0)
    except SQLAlchemyError:
        logger.warning("Could not query legacy records for checks_count", exc_info=True)

    failed_records = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_FAIL)
    )
    try:
        async with session.begin_nested():
            result = await session.scalar(
                select(func.count())
                .select_from(records_table)
                .where(records_table.c.type == "rec_fail")
            )
        failed_records = (failed_records or 0) + (result or 0)
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for failed_records", exc_info=True
        )

    result = ProjectStats(
        total_volunteers=total_volunteers or 0,
        total_records=total_records or 0,
        species_count=species_count or 0,
        processed_publications_count=processed_publications or 0,
        families_count=families_count or 0,
        checks_count=checks_count or 0,
        failed_records=failed_records or 0,
        total_users=total_volunteers or 0,
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
    rows: list[Row],
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

    records_entered = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    records_entered = (records_entered or 0) + (
        await _legacy_scalar(
            session,
            select(func.count())
            .select_from(records_table)
            .where(
                records_table.c.user_id == user_id,
                records_table.c.type == "rec_ok",
            ),
            "Could not query legacy records for user records_entered",
        )
        or 0
    )

    publications_processed = await session.scalar(
        select(func.count(func.distinct(EventRecord.publ_id)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    legacy = await _legacy_scalar(
        session,
        select(func.count(func.distinct(records_table.c.publ_id)))
        .select_from(records_table)
        .where(
            records_table.c.user_id == user_id,
            records_table.c.type == "rec_ok",
        ),
        "Could not query legacy records for user publications_processed",
    )
    publications_processed = (publications_processed or 0) + (legacy or 0)

    most_common_family = await session.scalar(
        select(EventRecord.family)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.family)
        .order_by(func.count().desc())
        .limit(1)
    )
    er_family = select(EventRecord.family.label("family")).where(
        EventRecord.user_id == user_id,
        EventRecord.type == RecordType.REC_OK,
    )
    r_family = select(records_table.c.tax_fam.label("family")).where(
        records_table.c.user_id == user_id,
        records_table.c.type == "rec_ok",
    )
    combined_family = union_all(er_family, r_family).subquery()
    most_common_family = (
        await _legacy_scalar(
            session,
            select(combined_family.c.family)
            .where(combined_family.c.family.isnot(None), combined_family.c.family != "")
            .group_by(combined_family.c.family)
            .order_by(func.count().desc())
            .limit(1),
            "Could not query legacy records for user most_common_family",
        )
        or most_common_family
    )

    most_common_genus = await session.scalar(
        select(EventRecord.genus)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.genus)
        .order_by(func.count().desc())
        .limit(1)
    )
    er_genus = select(EventRecord.genus.label("genus")).where(
        EventRecord.user_id == user_id,
        EventRecord.type == RecordType.REC_OK,
    )
    r_genus = select(records_table.c.tax_gen.label("genus")).where(
        records_table.c.user_id == user_id,
        records_table.c.type == "rec_ok",
    )
    combined_genus = union_all(er_genus, r_genus).subquery()
    most_common_genus = (
        await _legacy_scalar(
            session,
            select(combined_genus.c.genus)
            .where(combined_genus.c.genus.isnot(None), combined_genus.c.genus != "")
            .group_by(combined_genus.c.genus)
            .order_by(func.count().desc())
            .limit(1),
            "Could not query legacy records for user most_common_genus",
        )
        or most_common_genus
    )

    most_common_species = await session.scalar(
        select(EventRecord.genus + " " + EventRecord.species)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.genus, EventRecord.species)
        .order_by(func.count().desc())
        .limit(1)
    )
    er_species = select(
        (EventRecord.genus + " " + EventRecord.species).label("species")
    ).where(
        EventRecord.user_id == user_id,
        EventRecord.type == RecordType.REC_OK,
    )
    r_species = select(
        (records_table.c.tax_gen + " " + records_table.c.tax_sp).label("species")
    ).where(
        records_table.c.user_id == user_id,
        records_table.c.type == "rec_ok",
    )
    combined_species = union_all(er_species, r_species).subquery()
    most_common_species = (
        await _legacy_scalar(
            session,
            select(combined_species.c.species)
            .where(
                combined_species.c.species.isnot(None),
                combined_species.c.species != " ",
            )
            .group_by(combined_species.c.species)
            .order_by(func.count().desc())
            .limit(1),
            "Could not query legacy records for user most_common_species",
        )
        or most_common_species
    )

    top_species_stmt = (
        select(
            EventRecord.genus,
            EventRecord.species,
            func.count().label("cnt"),
        )
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.genus, EventRecord.species)
        .order_by(func.count().desc())
        .limit(4)
    )
    rows = (await session.execute(top_species_stmt)).all()
    top_species = await _merge_top_species(session, user_id, rows)

    checks_count = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type.in_([RecordType.CHECK_OK, RecordType.CHECK_FAIL]),
        )
    )
    legacy = await _legacy_scalar(
        session,
        select(func.count())
        .select_from(records_table)
        .where(
            records_table.c.user_id == user_id,
            records_table.c.type.in_(["check_ok", "check_fail"]),
        ),
        "Could not query legacy records for user checks_count",
    )
    checks_count = (checks_count or 0) + (legacy or 0)

    failed_records = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_FAIL)
    )
    legacy = await _legacy_scalar(
        session,
        select(func.count())
        .select_from(records_table)
        .where(
            records_table.c.user_id == user_id,
            records_table.c.type == "rec_fail",
        ),
        "Could not query legacy records for user failed_records",
    )
    failed_records = (failed_records or 0) + (legacy or 0)

    total_individuals = await session.scalar(
        select(func.sum(func.ceil(EventRecord.quantity)))
        .select_from(EventRecord)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type == RecordType.REC_OK,
            EventRecord.quantity.isnot(None),
        )
    )
    legacy = await _legacy_scalar(
        session,
        select(func.sum(records_table.c.abu))
        .select_from(records_table)
        .where(
            records_table.c.user_id == user_id,
            records_table.c.type == "rec_ok",
        ),
        "Could not query legacy records for user total_individuals",
    )
    total_individuals = (total_individuals or 0) + (legacy or 0)

    distinct_families = await session.scalar(
        select(func.count(func.distinct(EventRecord.family)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    legacy = await _legacy_scalar(
        session,
        select(func.count(func.distinct(records_table.c.tax_fam)))
        .select_from(records_table)
        .where(
            records_table.c.user_id == user_id,
            records_table.c.type == "rec_ok",
        ),
        "Could not query legacy records for user distinct_families",
    )
    distinct_families = (distinct_families or 0) + (legacy or 0)

    distinct_genera = await session.scalar(
        select(func.count(func.distinct(EventRecord.genus)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    legacy = await _legacy_scalar(
        session,
        select(func.count(func.distinct(records_table.c.tax_gen)))
        .select_from(records_table)
        .where(
            records_table.c.user_id == user_id,
            records_table.c.type == "rec_ok",
        ),
        "Could not query legacy records for user distinct_genera",
    )
    distinct_genera = (distinct_genera or 0) + (legacy or 0)

    distinct_species = await session.scalar(
        select(func.count(func.distinct(EventRecord.species)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    legacy = await _legacy_scalar(
        session,
        select(
            func.count(
                func.distinct(records_table.c.tax_gen + " " + records_table.c.tax_sp)
            )
        )
        .select_from(records_table)
        .where(
            records_table.c.user_id == user_id,
            records_table.c.type == "rec_ok",
        ),
        "Could not query legacy records for user distinct_species",
    )
    distinct_species = (distinct_species or 0) + (legacy or 0)

    most_common_year = await session.scalar(
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
    er_year = (
        select(Publication.year.label("year"))
        .select_from(EventRecord)
        .join(Publication, EventRecord.publ_id == Publication.publ_id)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type == RecordType.REC_OK,
            Publication.year.isnot(None),
        )
    )
    r_year = select(records_table.c.eve_YY.label("year")).where(
        records_table.c.user_id == user_id,
        records_table.c.type == "rec_ok",
        records_table.c.eve_YY.isnot(None),
    )
    combined_year = union_all(er_year, r_year).subquery()
    most_common_year = (
        await _legacy_scalar(
            session,
            select(combined_year.c.year)
            .where(combined_year.c.year.isnot(None))
            .group_by(combined_year.c.year)
            .order_by(func.count().desc())
            .limit(1),
            "Could not query legacy records for user most_common_year",
        )
        or most_common_year
    )

    result: UserStats = {
        "records_entered": records_entered or 0,
        "publications_processed": publications_processed or 0,
        "most_common_family": most_common_family,
        "most_common_genus": most_common_genus,
        "most_common_species": most_common_species,
        "top_species": top_species,
        "checks_count": checks_count or 0,
        "failed_records": failed_records or 0,
        "total_individuals": total_individuals or 0,
        "distinct_families": distinct_families or 0,
        "distinct_genera": distinct_genera or 0,
        "distinct_species": distinct_species or 0,
        "most_common_year": most_common_year,
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
    stmt = union_all(er_stmt, r_stmt).order_by(er_stmt.c.date)
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
        counts[publ_id] = counts.get(publ_id, 0) + cnt

    try:
        async with session.begin_nested():
            rows = await session.execute(
                select(
                    records_table.c.publ_id,
                    func.count(func.distinct(records_table.c.user_id)),
                )
                .where(records_table.c.type == "rec_ok")
                .group_by(records_table.c.publ_id)
            )
            for publ_id, cnt in rows:
                counts[publ_id] = counts.get(publ_id, 0) + cnt
    except SQLAlchemyError:
        logger.warning("Could not query legacy records for progress", exc_info=True)

    for publ_id, value in counts.items():
        counts[publ_id] = min(value, 3)

    processed = sum(counts.values()) // 3

    result = (total, processed)
    _project_stats_cache["progress"] = result
    return result
