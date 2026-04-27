import logging
from collections.abc import Sequence
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import and_, delete, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import EventRecord
from schemas.records import RecordBase, RecordUpdate

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


async def get_record(
    session: AsyncSession, record_id: UUID, user_id: int
) -> EventRecord | None:
    stmt = select(EventRecord).where(
        and_(EventRecord.id == record_id, EventRecord.user_id == user_id)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def update_record(
    session: AsyncSession,
    record_id: UUID,
    user_id: int,
    data: RecordUpdate,
) -> bool:
    stmt = (
        update(EventRecord)
        .where(and_(EventRecord.id == record_id, EventRecord.user_id == user_id))
        .values(data.model_dump(exclude_unset=True, mode="python"))
        .returning(EventRecord.id)
    )

    result = await session.execute(stmt)
    await session.commit()

    return result.scalar_one_or_none() is not None
