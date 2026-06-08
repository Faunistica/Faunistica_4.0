import logging

from cachetools import TTLCache
from sqlalchemy import func, select, text
from sqlalchemy.engine import Row
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.enums import RecordType, UserState
from core.model import Action, EventRecord, Publication, User
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
            result = await session.execute(
                text("SELECT COUNT(*) FROM records WHERE type = 'rec_ok'")
            )
        total_records = (total_records or 0) + (result.scalar() or 0)
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
            result = await session.execute(
                text(
                    "SELECT COUNT(DISTINCT tax_gen || ' ' || tax_sp) FROM records WHERE type = 'rec_ok'"
                )
            )
        species_count = (species_count or 0) + (result.scalar() or 0)
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
            result = await session.execute(
                text(
                    "SELECT COUNT(DISTINCT tax_fam) FROM records WHERE type = 'rec_ok'"
                )
            )
        families_count = (families_count or 0) + (result.scalar() or 0)
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
            result = await session.execute(
                text(
                    "SELECT COUNT(*) FROM records WHERE type IN ('check_ok', 'check_fail')"
                )
            )
        checks_count = (checks_count or 0) + (result.scalar() or 0)
    except SQLAlchemyError:
        logger.warning("Could not query legacy records for checks_count", exc_info=True)

    failed_records = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_FAIL)
    )
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("SELECT COUNT(*) FROM records WHERE type = 'rec_fail'")
            )
        failed_records = (failed_records or 0) + (result.scalar() or 0)
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


async def get_user_statistics(session: AsyncSession, user_id: int) -> UserStats:
    key = f"user_stats:{user_id}"
    if (cached := _user_stats_cache.get(key)) is not None:
        return cached

    records_entered = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    try:
        async with session.begin_nested():
            result = await session.execute(
                text(
                    "SELECT COUNT(*) FROM records WHERE user_id = :uid AND type = 'rec_ok'"
                ),
                {"uid": user_id},
            )
        records_entered = (records_entered or 0) + (result.scalar() or 0)
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for user records_entered", exc_info=True
        )

    publications_processed = await session.scalar(
        select(func.count(func.distinct(EventRecord.publ_id)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    try:
        async with session.begin_nested():
            result = await session.execute(
                text(
                    "SELECT COUNT(DISTINCT publ_id) FROM records WHERE user_id = :uid AND type = 'rec_ok'"
                ),
                {"uid": user_id},
            )
        publications_processed = (publications_processed or 0) + (result.scalar() or 0)
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for user publications_processed",
            exc_info=True,
        )

    most_common_family = await session.scalar(
        select(EventRecord.family)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.family)
        .order_by(func.count().desc())
        .limit(1)
    )
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("""
                    SELECT family FROM (
                        SELECT family FROM event_records WHERE user_id = :uid AND type = 'rec_ok'
                        UNION ALL
                        SELECT tax_fam FROM records WHERE user_id = :uid AND type = 'rec_ok'
                    ) combined
                    WHERE family IS NOT NULL AND family != ''
                    GROUP BY family
                    ORDER BY COUNT(*) DESC
                    LIMIT 1
                """),
                {"uid": user_id},
            )
        most_common_family = result.scalar()
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for user most_common_family", exc_info=True
        )

    most_common_genus = await session.scalar(
        select(EventRecord.genus)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.genus)
        .order_by(func.count().desc())
        .limit(1)
    )
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("""
                    SELECT genus FROM (
                        SELECT genus FROM event_records WHERE user_id = :uid AND type = 'rec_ok'
                        UNION ALL
                        SELECT tax_gen FROM records WHERE user_id = :uid AND type = 'rec_ok'
                    ) combined
                    WHERE genus IS NOT NULL AND genus != ''
                    GROUP BY genus
                    ORDER BY COUNT(*) DESC
                    LIMIT 1
                """),
                {"uid": user_id},
            )
        most_common_genus = result.scalar()
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for user most_common_genus", exc_info=True
        )

    most_common_species = await session.scalar(
        select(EventRecord.genus + " " + EventRecord.species)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.genus, EventRecord.species)
        .order_by(func.count().desc())
        .limit(1)
    )
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("""
                    SELECT species FROM (
                        SELECT genus || ' ' || specificepithet AS species
                        FROM event_records WHERE user_id = :uid AND type = 'rec_ok'
                        UNION ALL
                        SELECT tax_gen || ' ' || tax_sp AS species
                        FROM records WHERE user_id = :uid AND type = 'rec_ok'
                    ) combined
                    WHERE species IS NOT NULL AND species != ' '
                    GROUP BY species
                    ORDER BY COUNT(*) DESC
                    LIMIT 1
                """),
                {"uid": user_id},
            )
        most_common_species = result.scalar()
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for user most_common_species", exc_info=True
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
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("""
                    SELECT tax_gen, tax_sp, COUNT(*) as cnt
                    FROM records
                    WHERE user_id = :uid AND type = 'rec_ok'
                    GROUP BY tax_gen, tax_sp
                    ORDER BY cnt DESC
                    LIMIT 4
                """),
                {"uid": user_id},
            )
        legacy_top = {(r.tax_gen, r.tax_sp): r.cnt for r in result.fetchall()}
        species_counts: dict[tuple[str | None, str | None], int] = {}
        for r in rows:
            key = (r.genus, r.species)
            species_counts[key] = species_counts.get(key, 0) + r.cnt
        for (g, s), c in legacy_top.items():
            species_counts[(g, s)] = species_counts.get((g, s), 0) + c
        top_sorted = sorted(species_counts.items(), key=lambda x: -x[1])[:4]
        top_species = [
            TopSpeciesItem(species=f"{g} {s}".strip(), count=c)
            for (g, s), c in top_sorted
        ]
    except SQLAlchemyError:
        top_species = [
            TopSpeciesItem(species=f"{r.genus} {r.species}".strip(), count=r.cnt)
            for r in rows
        ]

    checks_count = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type.in_([RecordType.CHECK_OK, RecordType.CHECK_FAIL]),
        )
    )
    try:
        async with session.begin_nested():
            result = await session.execute(
                text(
                    "SELECT COUNT(*) FROM records WHERE user_id = :uid AND type IN ('check_ok', 'check_fail')"
                ),
                {"uid": user_id},
            )
        checks_count = (checks_count or 0) + (result.scalar() or 0)
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for user checks_count", exc_info=True
        )

    failed_records = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_FAIL)
    )
    try:
        async with session.begin_nested():
            result = await session.execute(
                text(
                    "SELECT COUNT(*) FROM records WHERE user_id = :uid AND type = 'rec_fail'"
                ),
                {"uid": user_id},
            )
        failed_records = (failed_records or 0) + (result.scalar() or 0)
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for user failed_records", exc_info=True
        )

    total_individuals = await session.scalar(
        select(func.sum(func.ceil(EventRecord.quantity)))
        .select_from(EventRecord)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type == RecordType.REC_OK,
            EventRecord.quantity.isnot(None),
        )
    )
    try:
        async with session.begin_nested():
            result = await session.execute(
                text(
                    "SELECT SUM(abu) FROM records WHERE user_id = :uid AND type = 'rec_ok'"
                ),
                {"uid": user_id},
            )
        total_individuals = (total_individuals or 0) + (result.scalar() or 0)
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for user total_individuals", exc_info=True
        )

    distinct_families = await session.scalar(
        select(func.count(func.distinct(EventRecord.family)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    try:
        async with session.begin_nested():
            result = await session.execute(
                text(
                    "SELECT COUNT(DISTINCT tax_fam) FROM records WHERE user_id = :uid AND type = 'rec_ok'"
                ),
                {"uid": user_id},
            )
        distinct_families = (distinct_families or 0) + (result.scalar() or 0)
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for user distinct_families", exc_info=True
        )

    distinct_genera = await session.scalar(
        select(func.count(func.distinct(EventRecord.genus)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    try:
        async with session.begin_nested():
            result = await session.execute(
                text(
                    "SELECT COUNT(DISTINCT tax_gen) FROM records WHERE user_id = :uid AND type = 'rec_ok'"
                ),
                {"uid": user_id},
            )
        distinct_genera = (distinct_genera or 0) + (result.scalar() or 0)
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for user distinct_genera", exc_info=True
        )

    distinct_species = await session.scalar(
        select(func.count(func.distinct(EventRecord.species)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    try:
        async with session.begin_nested():
            result = await session.execute(
                text(
                    "SELECT COUNT(DISTINCT tax_gen || ' ' || tax_sp) FROM records WHERE user_id = :uid AND type = 'rec_ok'"
                ),
                {"uid": user_id},
            )
        distinct_species = (distinct_species or 0) + (result.scalar() or 0)
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for user distinct_species", exc_info=True
        )

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
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("""
                    SELECT year FROM (
                        SELECT p.year
                        FROM event_records er
                        JOIN publications p ON er.publ_id = p.publ_id
                        WHERE er.user_id = :uid AND er.type = 'rec_ok' AND p.year IS NOT NULL
                        UNION ALL
                        SELECT eve_yy FROM records
                        WHERE user_id = :uid AND type = 'rec_ok' AND eve_yy IS NOT NULL
                    ) combined
                    WHERE year IS NOT NULL
                    GROUP BY year
                    ORDER BY COUNT(*) DESC
                    LIMIT 1
                """),
                {"uid": user_id},
            )
        most_common_year = result.scalar()
    except SQLAlchemyError:
        logger.warning(
            "Could not query legacy records for user most_common_year", exc_info=True
        )

    result = {
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
    stmt = text("""
        SELECT a.user_id, a.object, a.datetime,
               u.name, u.tlg_name, u.tlg_username
        FROM actions a
        INNER JOIN users u ON a.user_id = u.user_id
        WHERE a.action IN ('fau_50', 'fau_100')
        ORDER BY a.datetime DESC
    """)
    result = await session.execute(stmt)
    return list(result.fetchall())


async def get_cumulative_volunteers(session: AsyncSession) -> list[Row]:
    if (cached := _project_stats_cache.get("cumulative_volunteers")) is not None:
        return cached
    stmt = text("""
        SELECT DATE(reg_run) as date, COUNT(*) as cnt
        FROM users
        WHERE reg_run IS NOT NULL
        GROUP BY DATE(reg_run)
        ORDER BY date
    """)
    result = await session.execute(stmt)
    rows = list(result.fetchall())
    _project_stats_cache["cumulative_volunteers"] = rows
    return rows


async def get_cumulative_records(session: AsyncSession) -> list[Row]:
    if (cached := _project_stats_cache.get("cumulative_records")) is not None:
        return cached
    stmt = text("""
        SELECT DATE(datetime) as date, COUNT(*) as cnt
        FROM event_records
        WHERE type = 'rec_ok'
        GROUP BY DATE(datetime)
        UNION ALL
        SELECT DATE(datetime) as date, COUNT(*) as cnt
        FROM records
        WHERE type = 'rec_ok'
        GROUP BY DATE(datetime)
        ORDER BY date
    """)
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
                text("""
                    SELECT publ_id, COUNT(DISTINCT user_id)
                    FROM records
                    WHERE type = 'rec_ok'
                    GROUP BY publ_id
                """)
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
