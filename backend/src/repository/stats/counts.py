from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.enums import RecordType, UserState
from core.model import Action, EventRecord, Publication, User, records_table
from repository.util import _legacy_scalar


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
    event_condition = EventRecord.type == RecordType.REC_OK
    legacy_condition = records_table.c.type == RecordType.REC_OK.value
    if user_id is not None:
        event_condition = and_(event_condition, EventRecord.user_id == user_id)
        legacy_condition = and_(legacy_condition, records_table.c.user_id == user_id)

    count = (
        await session.scalar(
            select(func.count()).select_from(EventRecord).where(event_condition)
        )
        or 0
    )
    legacy = await _legacy_scalar(
        session,
        select(func.count()).select_from(records_table).where(legacy_condition),
        "Could not query legacy records for total_records",
    )
    return count + (legacy or 0)


async def count_failed_records(
    session: AsyncSession, user_id: int | None = None
) -> int:
    event_condition = EventRecord.type == RecordType.REC_FAIL
    legacy_condition = records_table.c.type == RecordType.REC_FAIL.value
    if user_id is not None:
        event_condition = and_(event_condition, EventRecord.user_id == user_id)
        legacy_condition = and_(legacy_condition, records_table.c.user_id == user_id)

    count = (
        await session.scalar(
            select(func.count()).select_from(EventRecord).where(event_condition)
        )
        or 0
    )
    legacy = await _legacy_scalar(
        session,
        select(func.count()).select_from(records_table).where(legacy_condition),
        "Could not query legacy records for failed_records",
    )
    return count + (legacy or 0)


async def count_checks(session: AsyncSession, user_id: int | None = None) -> int:
    event_condition = EventRecord.type.in_([RecordType.CHECK_OK, RecordType.CHECK_FAIL])
    legacy_condition = records_table.c.type.in_(["check_ok", "check_fail"])
    if user_id is not None:
        event_condition = and_(event_condition, EventRecord.user_id == user_id)
        legacy_condition = and_(legacy_condition, records_table.c.user_id == user_id)

    count = (
        await session.scalar(
            select(func.count()).select_from(EventRecord).where(event_condition)
        )
        or 0
    )
    legacy = await _legacy_scalar(
        session,
        select(func.count()).select_from(records_table).where(legacy_condition),
        "Could not query legacy records for checks",
    )
    return count + (legacy or 0)


async def count_species(session: AsyncSession, user_id: int | None = None) -> int:
    event_condition = EventRecord.type == RecordType.REC_OK
    legacy_condition = records_table.c.type == RecordType.REC_OK.value
    if user_id is not None:
        event_condition = and_(event_condition, EventRecord.user_id == user_id)
        legacy_condition = and_(legacy_condition, records_table.c.user_id == user_id)

    event_count = (
        await session.scalar(
            select(
                func.count(
                    func.distinct(
                        EventRecord.genus + " " + EventRecord.species
                    )
                )
            )
            .select_from(EventRecord)
            .where(event_condition)
        )
        or 0
    )
    legacy_count = await _legacy_scalar(
        session,
        select(
            func.count(
                func.distinct(
                    records_table.c.tax_gen + " " + records_table.c.tax_sp
                )
            )
        )
        .select_from(records_table)
        .where(legacy_condition),
        "Could not query records for species_count",
    )
    return event_count + (legacy_count or 0)


async def count_families(session: AsyncSession, user_id: int | None = None) -> int:
    event_condition = EventRecord.type == RecordType.REC_OK
    legacy_condition = records_table.c.type == RecordType.REC_OK.value
    if user_id is not None:
        event_condition = and_(event_condition, EventRecord.user_id == user_id)
        legacy_condition = and_(legacy_condition, records_table.c.user_id == user_id)

    event_count = (
        await session.scalar(
            select(func.count(func.distinct(EventRecord.family)))
            .select_from(EventRecord)
            .where(event_condition)
        )
        or 0
    )
    legacy_count = await _legacy_scalar(
        session,
        select(func.count(func.distinct(records_table.c.tax_fam)))
        .select_from(records_table)
        .where(legacy_condition),
        "Could not query records for families_count",
    )
    return event_count + (legacy_count or 0)


async def count_genera(session: AsyncSession, user_id: int | None = None) -> int:
    event_condition = EventRecord.type == RecordType.REC_OK
    legacy_condition = records_table.c.type == RecordType.REC_OK.value
    if user_id is not None:
        event_condition = and_(event_condition, EventRecord.user_id == user_id)
        legacy_condition = and_(legacy_condition, records_table.c.user_id == user_id)

    event_count = (
        await session.scalar(
            select(func.count(func.distinct(EventRecord.genus)))
            .select_from(EventRecord)
            .where(event_condition)
        )
        or 0
    )
    legacy_count = await _legacy_scalar(
        session,
        select(func.count(func.distinct(records_table.c.tax_gen)))
        .select_from(records_table)
        .where(legacy_condition),
        "Could not query records for genera_count",
    )
    return event_count + (legacy_count or 0)


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
    event_count = (
        await session.scalar(
            select(func.count(func.distinct(EventRecord.publ_id)))
            .select_from(EventRecord)
            .where(
                EventRecord.user_id == user_id,
                EventRecord.type == RecordType.REC_OK,
            )
        )
        or 0
    )
    legacy_count = await _legacy_scalar(
        session,
        select(func.count(func.distinct(records_table.c.publ_id)))
        .select_from(records_table)
        .where(
            records_table.c.user_id == user_id,
            records_table.c.type == "rec_ok",
        ),
        "Could not query records for user publications",
    )
    return event_count + (legacy_count or 0)


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
