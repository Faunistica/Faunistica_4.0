import logging

from cachetools import TTLCache
from sqlalchemy import func, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from core.enums import RecordType, UserState
from core.model import EventRecord, Publication, User

logger = logging.getLogger(__name__)

_bot_general_cache = TTLCache(maxsize=1, ttl=300)
_bot_user_cache = TTLCache(maxsize=1024, ttl=300)


async def get_bot_general_stats(session: AsyncSession) -> dict:
    if (cached := _bot_general_cache.get("bot_general_stats")) is not None:
        return cached

    total_users = await session.scalar(
        select(func.count())
        .select_from(User)
        .where(
            (User.reg_stat == UserState.REG_COMPLETED)
            | (User.reg_stat >= UserState.SUPPORT)
        )
    )
    total_users = total_users or 0

    avg_age = await session.scalar(select(func.avg(User.age)))
    avg_age = round(avg_age, 1) if avg_age is not None else None

    total_publs = await session.scalar(
        select(func.count())
        .select_from(Publication)
        .where(Publication.ural > 0, Publication.coords > 0, Publication.occs == 1)
    )
    total_publs = total_publs or 0

    rus_publs = await session.scalar(
        select(func.count())
        .select_from(Publication)
        .where(
            Publication.ural > 0,
            Publication.coords > 0,
            Publication.occs == 1,
            Publication.language == "rus",
        )
    )
    rus_publs = rus_publs or 0

    eng_publs = await session.scalar(
        select(func.count())
        .select_from(Publication)
        .where(
            Publication.ural > 0,
            Publication.coords > 0,
            Publication.occs == 1,
            Publication.language == "eng",
        )
    )
    eng_publs = eng_publs or 0

    rec_ok = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_OK)
    )
    rec_ok = rec_ok or 0
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("SELECT COUNT(*) FROM records WHERE type = 'rec_ok'")
            )
        rec_ok += result.scalar() or 0
    except SQLAlchemyError:
        logger.warning("Could not query legacy records for rec_ok", exc_info=True)

    rec_fail = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_FAIL)
    )
    rec_fail = rec_fail or 0
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("SELECT COUNT(*) FROM records WHERE type = 'rec_fail'")
            )
        rec_fail += result.scalar() or 0
    except SQLAlchemyError:
        logger.warning("Could not query legacy records for rec_fail", exc_info=True)
    rec_fail_ratio = round(rec_fail / rec_ok, 2) if rec_ok > 0 else None

    check_ok = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.CHECK_OK)
    )
    check_ok = check_ok or 0
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("SELECT COUNT(*) FROM records WHERE type = 'check_ok'")
            )
        check_ok += result.scalar() or 0
    except SQLAlchemyError:
        logger.warning("Could not query legacy records for check_ok", exc_info=True)

    check_fail = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.CHECK_FAIL)
    )
    check_fail = check_fail or 0
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("SELECT COUNT(*) FROM records WHERE type = 'check_fail'")
            )
        check_fail += result.scalar() or 0
    except SQLAlchemyError:
        logger.warning("Could not query legacy records for check_fail", exc_info=True)
    check_ratio = round((check_ok + check_fail) / rec_ok, 1) if rec_ok > 0 else None

    species_count = await session.scalar(
        select(func.count(func.distinct(EventRecord.genus + " " + EventRecord.species)))
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_OK)
    )
    species_count = species_count or 0
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("SELECT COUNT(DISTINCT tax_gen || ' ' || tax_sp) FROM records WHERE type = 'rec_ok'")
            )
        species_count += result.scalar() or 0
    except SQLAlchemyError:
        logger.warning("Could not query legacy records for species_count", exc_info=True)

    families_count = await session.scalar(
        select(func.count(func.distinct(EventRecord.family)))
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_OK)
    )
    families_count = families_count or 0
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("SELECT COUNT(DISTINCT tax_fam) FROM records WHERE type = 'rec_ok'")
            )
        families_count += result.scalar() or 0
    except SQLAlchemyError:
        logger.warning("Could not query legacy records for families_count", exc_info=True)

    result = {
        "total_users": total_users,
        "avg_age": avg_age,
        "total_publs": total_publs,
        "rus_publs": rus_publs,
        "eng_publs": eng_publs,
        "rec_ok": rec_ok,
        "rec_fail_ratio": rec_fail_ratio,
        "check_ratio": check_ratio,
        "species_count": species_count,
        "families_count": families_count,
    }
    _bot_general_cache["bot_general_stats"] = result
    return result


async def get_bot_user_stats(session: AsyncSession, user_id: int) -> dict:
    key = f"bot_user_stats:{user_id}"
    if (cached := _bot_user_cache.get(key)) is not None:
        return cached

    processed_publs = await session.scalar(
        select(func.count(func.distinct(EventRecord.publ_id)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    processed_publs = processed_publs or 0
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("SELECT COUNT(DISTINCT publ_id) FROM records WHERE user_id = :uid AND type = 'rec_ok'"),
                {"uid": user_id},
            )
        processed_publs += result.scalar() or 0
    except SQLAlchemyError:
        logger.warning("Could not query legacy records for bot user processed_publs", exc_info=True)

    rec_ok = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    rec_ok = rec_ok or 0
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("SELECT COUNT(*) FROM records WHERE user_id = :uid AND type = 'rec_ok'"),
                {"uid": user_id},
            )
        rec_ok += result.scalar() or 0
    except SQLAlchemyError:
        logger.warning("Could not query legacy records for bot user rec_ok", exc_info=True)

    checks = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type.in_([RecordType.CHECK_OK, RecordType.CHECK_FAIL]),
        )
    )
    checks = checks or 0
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("SELECT COUNT(*) FROM records WHERE user_id = :uid AND type IN ('check_ok', 'check_fail')"),
                {"uid": user_id},
            )
        checks += result.scalar() or 0
    except SQLAlchemyError:
        logger.warning("Could not query legacy records for bot user checks", exc_info=True)
    check_ratio = round(checks / rec_ok, 1) if rec_ok > 0 else None

    species_count = await session.scalar(
        select(func.count(func.distinct(EventRecord.genus + " " + EventRecord.species)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    species_count = species_count or 0
    try:
        async with session.begin_nested():
            result = await session.execute(
                text("SELECT COUNT(DISTINCT tax_gen || ' ' || tax_sp) FROM records WHERE user_id = :uid AND type = 'rec_ok'"),
                {"uid": user_id},
            )
        species_count += result.scalar() or 0
    except SQLAlchemyError:
        logger.warning("Could not query legacy records for bot user species_count", exc_info=True)

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
        logger.warning("Could not query legacy records for bot user most_common_species", exc_info=True)

    result = {
        "processed_publs": processed_publs,
        "rec_ok": rec_ok,
        "check_ratio": check_ratio,
        "species_count": species_count,
        "most_common_species": most_common_species,
    }
    _bot_user_cache[key] = result
    return result
