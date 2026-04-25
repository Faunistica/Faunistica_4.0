import logging
from collections.abc import Sequence

from sqlalchemy import and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.model import Record

logger = logging.getLogger(__name__)


async def create_record(session: AsyncSession, record_json: dict) -> None:
    record = Record(**record_json)
    session.add(record)
    await session.commit()


async def get_user_records(session: AsyncSession, user_id: int) -> Sequence[Record]:
    stmt = select(Record).where(Record.user_id == user_id)
    result = await session.execute(stmt)
    return result.scalars().all()


async def delete_record(session: AsyncSession, record_id: int, user_id: int) -> bool:
    stmt = select(Record).where(and_(Record.id == record_id, Record.user_id == user_id))
    result = await session.execute(stmt)
    record = result.scalar_one_or_none()

    if record is not None:
        await session.delete(record)
        await session.commit()
        return True
    return False


async def get_record(
    session: AsyncSession, record_id: int, user_id: int
) -> Record | None:
    stmt = select(Record).where(and_(Record.id == record_id, Record.user_id == user_id))
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


# FIXME: wtf
async def update_record(
    session: AsyncSession, record_id: int, user_id: int, new_data: dict
) -> bool:
    stmt = select(Record).where(and_(Record.id == record_id, Record.user_id == user_id))
    result = await session.execute(stmt)
    record = result.scalar_one_or_none()

    if record is None:
        return False

    for key, value in new_data.items():
        if key != "hash":
            setattr(record, key, value)

    await session.commit()
    return True
