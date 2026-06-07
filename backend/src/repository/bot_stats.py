from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.enums import RecordType, UserState
from core.model import EventRecord, Publication, User


async def get_bot_general_stats(session: AsyncSession) -> dict:
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

    rec_fail = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_FAIL)
    )
    rec_fail = rec_fail or 0
    rec_fail_ratio = round(rec_fail / rec_ok, 2) if rec_ok > 0 else None

    check_ok = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.CHECK_OK)
    )
    check_ok = check_ok or 0
    check_fail = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.CHECK_FAIL)
    )
    check_fail = check_fail or 0
    check_ratio = round((check_ok + check_fail) / rec_ok, 1) if rec_ok > 0 else None

    species_count = await session.scalar(
        select(func.count(func.distinct(EventRecord.genus + " " + EventRecord.species)))
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_OK)
    )
    species_count = species_count or 0

    families_count = await session.scalar(
        select(func.count(func.distinct(EventRecord.family)))
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_OK)
    )
    families_count = families_count or 0

    return {
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


async def get_bot_user_stats(session: AsyncSession, user_id: int) -> dict:
    processed_publs = await session.scalar(
        select(func.count(func.distinct(EventRecord.publ_id)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    processed_publs = processed_publs or 0

    rec_ok = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    rec_ok = rec_ok or 0

    checks = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type.in_([RecordType.CHECK_OK, RecordType.CHECK_FAIL]),
        )
    )
    checks = checks or 0
    check_ratio = round(checks / rec_ok, 1) if rec_ok > 0 else None

    species_count = await session.scalar(
        select(func.count(func.distinct(EventRecord.genus + " " + EventRecord.species)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )
    species_count = species_count or 0

    most_common_species = await session.scalar(
        select(EventRecord.genus + " " + EventRecord.species)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.genus, EventRecord.species)
        .order_by(func.count().desc())
        .limit(1)
    )

    return {
        "processed_publs": processed_publs,
        "rec_ok": rec_ok,
        "check_ratio": check_ratio,
        "species_count": species_count,
        "most_common_species": most_common_species,
    }
