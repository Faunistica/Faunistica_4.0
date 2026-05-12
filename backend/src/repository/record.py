import logging
from collections.abc import Sequence
from datetime import datetime
from typing import Literal
from uuid import UUID

from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import EventRecord
from schema.records import RecordMetadata

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
    data: dict,
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


async def get_records_paginated(
    session: AsyncSession,
    user_id: int,
    publ_id: int | None,
    page: int = 1,
    page_size: int = 20,
    sort: Literal["created_at", "updated_at"] = "created_at",
) -> tuple[Sequence[EventRecord], int]:
    offset = (page - 1) * page_size

    order_col = getattr(EventRecord, sort, EventRecord.created_at)

    if publ_id is None:
        where_condition = EventRecord.user_id == user_id
    else:
        where_condition = and_(
            EventRecord.user_id == user_id,
            EventRecord.publ_id == publ_id,
        )

    count_stmt = select(func.count()).where(where_condition)
    count_result = await session.execute(count_stmt)
    total = count_result.scalar_one()

    stmt = (
        select(EventRecord)
        .where(where_condition)
        .order_by(order_col.desc())
        .offset(offset)
        .limit(page_size)
    )

    result = await session.execute(stmt)
    return result.scalars().all(), total


async def count_records_by_publ(session: AsyncSession, publ_id: int) -> int:
    """Count total records for a publication."""
    stmt = select(func.count()).where(EventRecord.publ_id == publ_id)
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
