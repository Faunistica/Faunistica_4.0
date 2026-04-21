import logging
from collections.abc import Sequence

from sqlalchemy import and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models import Publ, Record
from schemas.common import Publication

logger = logging.getLogger(__name__)


async def add_record_from_json(session: AsyncSession, record_json: dict) -> None:
    record = Record(**record_json)
    session.add(record)
    await session.commit()


async def get_user_records(session: AsyncSession, user_id: int) -> Sequence[Record]:
    stmt = select(Record).where(Record.user_id == user_id)
    result = await session.execute(stmt)
    return result.scalars().all()


async def remove_record_row_by_id(
    session: AsyncSession, record_id: int, user_id: int
) -> bool:
    stmt = select(Record).where(and_(Record.id == record_id, Record.user_id == user_id))
    result = await session.execute(stmt)
    record = result.scalar_one_or_none()

    if record is not None:
        await session.delete(record)
        await session.commit()
        return True
    return False


async def get_record_by_id(
    session: AsyncSession, record_id: int, user_id: int
) -> Record | None:
    stmt = select(Record).where(and_(Record.id == record_id, Record.user_id == user_id))
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def edit_record_by_id(
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


async def find_publ_by_hash(
    session: AsyncSession, record_id: int, user_id: int
) -> Publication | None:
    record = await get_record_by_id(session, record_id, user_id)

    if record is None:
        return None

    stmt = select(Publ).filter_by(id=record.publ_id)
    result = await session.execute(stmt)
    publication = result.scalar_one_or_none()
    if publication is None:
        return None

    return Publication(
        author=publication.author,
        year=str(publication.year or ""),
        name=publication.name,
        pdf_file=publication.pdf_file,
    )
