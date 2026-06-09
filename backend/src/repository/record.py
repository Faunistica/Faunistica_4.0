import logging
from collections.abc import Sequence
from datetime import datetime
from typing import Literal
from uuid import UUID

from sqlalchemy import and_, delete, func, or_, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from core.enums import RecordType
from core.model import EventRecord, records_table
from schema.records import RecordMetadata, SpecimenDbRow

logger = logging.getLogger(__name__)


async def create_record(
    session: AsyncSession,
    metadata: RecordMetadata,
) -> EventRecord:
    stmt = pg_insert(EventRecord).values(**metadata.model_dump()).returning(EventRecord)
    result = await session.execute(stmt)

    return result.scalar_one()


async def get_record(session: AsyncSession, record_id: UUID) -> EventRecord | None:
    stmt = select(EventRecord).where(and_(EventRecord.id == record_id))

    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def update_record(
    session: AsyncSession,
    record_id: UUID,
    data: SpecimenDbRow,
    metadata: RecordMetadata,
    previous_update: datetime,
) -> EventRecord | None:
    """
    Update a record with optimistic locking via updated_at.
    Returns None if record not found or updated_at doesn't match (stale).
    """
    update_data = {**metadata.dump_for_update(), **data}

    stmt = (
        update(EventRecord)
        .where(
            and_(
                EventRecord.id == record_id,
                EventRecord.updated_at == previous_update,
            )
        )
        .values(update_data)
        .returning(EventRecord)
    )

    result = await session.execute(stmt)

    return result.scalar_one_or_none()


async def delete_record(session: AsyncSession, record_id: UUID) -> EventRecord | None:
    """Delete a record by ID.

    Returns the deleted record if found, None otherwise.
    """
    stmt = delete(EventRecord).where(EventRecord.id == record_id).returning(EventRecord)
    result = await session.execute(stmt)

    return result.scalar_one_or_none()


async def get_user_records(
    session: AsyncSession,
    user_id: int,
    sort: Literal["created_at", "updated_at"] = "created_at",
) -> tuple[Sequence[EventRecord], int]:
    order_col = getattr(EventRecord, sort, EventRecord.created_at)

    where_condition = and_(
        EventRecord.user_id == user_id,
        EventRecord.type != RecordType.REC_DEL,
    )

    count_stmt = select(func.count()).where(where_condition)
    count_result = await session.execute(count_stmt)
    total = count_result.scalar_one()

    stmt = (
        select(EventRecord)
        .where(where_condition)
        .order_by(EventRecord.publ_id.desc(), order_col.desc(), EventRecord.id)
    )

    result = await session.execute(stmt)
    return result.scalars().all(), total


async def get_records_paginated(
    session: AsyncSession,
    user_id: int,
    publ_id: int,
    page: int = 1,
    page_size: int = 20,
    sort: Literal["created_at", "updated_at"] = "created_at",
) -> tuple[Sequence[EventRecord], int]:
    offset = (page - 1) * page_size

    order_col = getattr(EventRecord, sort, EventRecord.created_at)

    where_condition = and_(
        EventRecord.user_id == user_id,
        EventRecord.publ_id == publ_id,
        EventRecord.type != RecordType.REC_DEL,
    )

    count_stmt = select(func.count()).where(where_condition)
    count_result = await session.execute(count_stmt)
    total = count_result.scalar_one()

    stmt = (
        select(EventRecord)
        .where(where_condition)
        .order_by(order_col.desc(), EventRecord.id)
        .offset(offset)
        .limit(page_size)
    )

    result = await session.execute(stmt)
    return result.scalars().all(), total


async def get_record_page(
    session: AsyncSession,
    record_id: UUID,
    user_id: int,
    publ_id: int,
    page_size: int = 20,
    sort: Literal["created_at", "updated_at"] = "created_at",
) -> tuple[int, int] | None:
    """
    Find which page a record is on in the sorted list.
    Returns (page_number, offset_within_page) or None if record not found.
    Page is 1-indexed, offset is 0-indexed within the page.
    """
    order_col = getattr(EventRecord, sort, EventRecord.created_at)

    pivot = (
        await session.execute(
            select(order_col, EventRecord.id).where(
                EventRecord.id == record_id,
                EventRecord.user_id == user_id,
                EventRecord.publ_id == publ_id,
                EventRecord.type != RecordType.REC_DEL,
            )
        )
    ).one_or_none()

    if pivot is None:
        return None

    pivot_sort_val, pivot_id = pivot

    where = and_(
        EventRecord.user_id == user_id,
        EventRecord.publ_id == publ_id,
        EventRecord.type != RecordType.REC_DEL,
    )
    before = or_(
        order_col > pivot_sort_val,
        and_(order_col == pivot_sort_val, EventRecord.id < pivot_id),
    )
    count_stmt = select(func.count()).where(where, before)
    count = (await session.execute(count_stmt)).scalar_one()

    offset = count
    page = offset // page_size + 1
    offset_in_page = offset % page_size

    return (page, offset_in_page)


async def count_records_by_user_publ(
    session: AsyncSession, user_id: int, publ_id: int
) -> int:
    """Count total records for a publication."""
    stmt = select(func.count()).where(
        EventRecord.user_id == user_id, EventRecord.publ_id == publ_id
    )
    result = await session.execute(stmt)
    return result.scalar_one()


async def delete_records_by_user_and_publ(
    session: AsyncSession, user_id: int, publ_id: int
) -> None:
    """Delete all records for a given user and publication."""
    stmt = delete(EventRecord).where(
        and_(EventRecord.user_id == user_id, EventRecord.publ_id == publ_id)
    )
    await session.execute(stmt)


async def get_event_records_for_export(
    session: AsyncSession,
    user_id: int,
    publ_id: int | None = None,
) -> Sequence[EventRecord]:
    where = and_(
        EventRecord.user_id == user_id,
        EventRecord.type == RecordType.REC_OK,
    )
    if publ_id is not None:
        where = and_(where, EventRecord.publ_id == publ_id)

    stmt = (
        select(EventRecord)
        .where(where)
        .order_by(EventRecord.created_at.desc(), EventRecord.id)
    )
    result = await session.execute(stmt)
    return result.scalars().all()


async def get_legacy_records_for_export(
    session: AsyncSession,
    user_id: int,
) -> list[dict]:
    stmt = (
        select(records_table)
        .where(
            and_(
                records_table.c["user_id"] == user_id,
                records_table.c["type"] == "rec_ok",
            )
        )
        .order_by(records_table.c["datetime"].desc())
    )
    result = await session.execute(stmt)
    return [dict(row._mapping) for row in result.all()]
