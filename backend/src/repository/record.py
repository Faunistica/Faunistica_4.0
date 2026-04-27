import logging
from collections.abc import Sequence
from typing import Literal
from uuid import UUID

from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import EventRecord
from schema.records import RecordData, RecordMetadata

logger = logging.getLogger(__name__)


async def create_record(
    session: AsyncSession,
    metadata: RecordMetadata,
) -> EventRecord:
    stmt = (
        pg_insert(EventRecord)
        .values(
            **metadata.model_dump(),
        )
        .returning(EventRecord)
    )
    result = await session.execute(stmt)
    await session.commit()

    return result.scalar_one()


async def get_user_records(
    session: AsyncSession, user_id: int
) -> Sequence[EventRecord]:
    stmt = select(EventRecord).where(EventRecord.user_id == user_id)
    result = await session.execute(stmt)

    return result.scalars().all()


async def delete_record(session: AsyncSession, record_id: UUID, user_id: int) -> bool:
    stmt = (
        delete(EventRecord)
        .where(and_(EventRecord.id == record_id, EventRecord.user_id == user_id))
        .returning(EventRecord.id)
    )
    result = await session.execute(stmt)

    return result.scalar_one_or_none() is not None


async def get_record(session: AsyncSession, record_id: UUID) -> EventRecord | None:
    stmt = select(EventRecord).where(and_(EventRecord.id == record_id))

    result = await session.execute(stmt)
    return result.scalar_one_or_none()


# FIXME: throw Permission error, don't silently fail
async def update_record(
    session: AsyncSession,
    record_id: UUID,
    data: RecordData,
    metadata: RecordMetadata,
) -> EventRecord | None:
    # Merge data and metadata, with data taking precedence for overlapping fields
    update_data = {**metadata.dump_for_update(), **data.model_dump(exclude_unset=True)}

    stmt = (
        update(EventRecord)
        .where(
            and_(
                EventRecord.id == record_id,
                EventRecord.user_id == metadata.user_id,
                EventRecord.updated_at == metadata.updated_at,
            )
        )
        .values(update_data)
        .returning(EventRecord)
    )

    result = await session.execute(stmt)
    await session.commit()

    return result.scalar_one_or_none()


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

    count_stmt = select(func.count()).where(
        and_(
            EventRecord.user_id == user_id,
            EventRecord.publ_id == publ_id,
        )
    )
    count_result = await session.execute(count_stmt)
    total = count_result.scalar_one()

    stmt = (
        select(EventRecord)
        .where(
            and_(
                EventRecord.user_id == user_id,
                EventRecord.publ_id == publ_id,
            )
        )
        .order_by(order_col.desc())
        .offset(offset)
        .limit(page_size)
    )

    result = await session.execute(stmt)
    return result.scalars().all(), total
