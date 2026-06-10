from sqlalchemy import SQLColumnExpression, and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.enums import RecordType, UserState
from core.model import Action, EventRecord, Publication, User, records_table


async def _count_rows_combined(
    session: AsyncSession,
    types: list[RecordType],
    user_id: int | None = None,
) -> int:
    event_filter = EventRecord.type.in_(types)
    legacy_filter = records_table.c.type.in_([t.value for t in types])
    if user_id is not None:
        event_filter = and_(event_filter, EventRecord.user_id == user_id)
        legacy_filter = and_(legacy_filter, records_table.c.user_id == user_id)

    event_n = (
        await session.scalar(
            select(func.count()).select_from(EventRecord).where(event_filter)
        )
        or 0
    )
    legacy_n = (
        await session.scalar(
            select(func.count()).select_from(records_table).where(legacy_filter)
        )
        or 0
    )
    return event_n + legacy_n


async def _count_distinct_combined[T](
    session: AsyncSession,
    event_key: SQLColumnExpression[T],
    legacy_key: SQLColumnExpression[T],
    types: list[RecordType],
    user_id: int | None = None,
) -> int:
    event_filter = EventRecord.type.in_(types)
    legacy_filter = records_table.c.type.in_([t.value for t in types])
    if user_id is not None:
        event_filter = and_(event_filter, EventRecord.user_id == user_id)
        legacy_filter = and_(legacy_filter, records_table.c.user_id == user_id)

    event_subq = select(event_key.label("k")).where(event_filter)
    legacy_subq = select(legacy_key.label("k")).where(legacy_filter)
    union = event_subq.union(legacy_subq).subquery()
    return await session.scalar(select(func.count(func.distinct(union.c.k)))) or 0


async def _sum_combined[T](
    session: AsyncSession,
    event_expr: SQLColumnExpression[T],
    legacy_expr: SQLColumnExpression[T],
    types: list[RecordType],
    user_id: int | None = None,
    event_extra_filter: SQLColumnExpression | None = None,
    legacy_extra_filter: SQLColumnExpression | None = None,
) -> float:
    event_filter = EventRecord.type.in_(types)
    legacy_filter = records_table.c.type.in_([t.value for t in types])
    if user_id is not None:
        event_filter = and_(event_filter, EventRecord.user_id == user_id)
        legacy_filter = and_(legacy_filter, records_table.c.user_id == user_id)
    if event_extra_filter is not None:
        event_filter = and_(event_filter, event_extra_filter)
    if legacy_extra_filter is not None:
        legacy_filter = and_(legacy_filter, legacy_extra_filter)

    event_n = (
        await session.scalar(
            select(func.sum(event_expr)).select_from(EventRecord).where(event_filter)
        )
        or 0
    )
    legacy_n = (
        await session.scalar(
            select(func.sum(legacy_expr))
            .select_from(records_table)
            .where(legacy_filter)
        )
        or 0
    )
    return float(event_n) + float(legacy_n)


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
    return await _count_rows_combined(session, [RecordType.REC_OK], user_id)


async def count_failed_records(
    session: AsyncSession, user_id: int | None = None
) -> int:
    return await _count_rows_combined(session, [RecordType.REC_FAIL], user_id)


async def count_checks(session: AsyncSession, user_id: int | None = None) -> int:
    return await _count_rows_combined(
        session, [RecordType.CHECK_OK, RecordType.CHECK_FAIL], user_id
    )


async def count_species(session: AsyncSession, user_id: int | None = None) -> int:
    event_key = EventRecord.genus + " " + EventRecord.species
    legacy_key = records_table.c.tax_gen + " " + records_table.c.tax_sp
    return await _count_distinct_combined(
        session, event_key, legacy_key, [RecordType.REC_OK], user_id
    )


async def count_families(session: AsyncSession, user_id: int | None = None) -> int:
    return await _count_distinct_combined(
        session,
        EventRecord.family,
        records_table.c.tax_fam,
        [RecordType.REC_OK],
        user_id,
    )


async def count_genera(session: AsyncSession, user_id: int | None = None) -> int:
    return await _count_distinct_combined(
        session,
        EventRecord.genus,
        records_table.c.tax_gen,
        [RecordType.REC_OK],
        user_id,
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
    return await _count_distinct_combined(
        session,
        EventRecord.publ_id,
        records_table.c.publ_id,
        [RecordType.REC_OK],
        user_id,
    )


async def sum_user_individuals(session: AsyncSession, user_id: int) -> float:
    return await _sum_combined(
        session,
        func.ceil(EventRecord.quantity),
        records_table.c.abu,
        [RecordType.REC_OK],
        user_id,
        event_extra_filter=EventRecord.quantity.isnot(None),
    )
