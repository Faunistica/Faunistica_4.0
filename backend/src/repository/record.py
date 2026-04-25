import logging
from collections.abc import Sequence

from sqlalchemy import and_, delete, insert, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import Record
from schemas.records import RecordBase, RecordUpdate

logger = logging.getLogger(__name__)


async def create_record(session: AsyncSession, record: RecordBase) -> None:
    stmt = insert(Record).values(**record.model_dump())
    await session.execute(stmt)
    await session.commit()


async def get_user_records(session: AsyncSession, user_id: int) -> Sequence[Record]:
    stmt = select(Record).where(Record.user_id == user_id)
    result = await session.execute(stmt)
    return result.scalars().all()


async def delete_record(session: AsyncSession, record_id: int, user_id: int) -> bool:
    stmt = (
        delete(Record)
        .where(and_(Record.id == record_id, Record.user_id == user_id))
        .returning(Record.id)
    )
    result = await session.execute(stmt)

    return result.scalar_one_or_none() is not None


async def get_record(
    session: AsyncSession, record_id: int, user_id: int
) -> Record | None:
    stmt = select(Record).where(and_(Record.id == record_id, Record.user_id == user_id))
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


# FIXME: wtf
async def update_record(
    session: AsyncSession,
    record_id: int,
    user_id: int,
    data: RecordUpdate,
) -> bool:
    stmt = (
        update(Record)
        .where(and_(Record.id == record_id, Record.user_id == user_id))
        .values(data.model_dump(exclude_unset=True))
        .returning(Record.id)
    )

    result = await session.execute(stmt)
    await session.commit()

    return result.scalar_one_or_none() is not None
