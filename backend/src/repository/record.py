import logging
from collections.abc import Sequence
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import EventRecord
from schema.records import RecordBase, RecordType, RecordUpdate

logger = logging.getLogger(__name__)


async def create_record(
    session: AsyncSession, record: RecordBase, ip: str
) -> EventRecord:
    now = datetime.now()
    new_id = uuid4()

    data = record.model_dump()
    del data["id"]

    stmt = pg_insert(EventRecord).values(
        id=new_id,
        **data,
        created_at=now,
        updated_at=now,
        ip=ip,
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


async def update_record(
    session: AsyncSession,
    record_id: UUID,
    data: RecordUpdate,
    *,
    type: RecordType,
    errors: str | None,
) -> bool:
    stmt = (
        update(EventRecord)
        .where(EventRecord.id == record_id)
        .values(type=type, errors=errors, **data.model_dump(exclude_unset=True))
        .returning(EventRecord.id)
    )

    result = await session.execute(stmt)
    await session.commit()

    return result.scalar_one_or_none() is not None


async def get_records_paginated(
    session: AsyncSession,
    user_id: int,
    publ_id: int,
    page: int = 1,
    page_size: int = 20,
    sort: str = "created_at",
) -> tuple[Sequence[EventRecord], int]:
    offset = (page - 1) * page_size

    if sort not in ("created_at", "updated_at"):
        sort = "created_at"

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
