import logging
from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.model import EventRecord, Publ, User

logger = logging.getLogger(__name__)


async def get_publication(session: AsyncSession, publ_id: int) -> Publ | None:
    stmt = select(Publ).where(Publ.id == publ_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_publications_for_language(
    session: AsyncSession, language: str
) -> Sequence[int]:
    filters = [Publ.ural.is_(True), Publ.coords.is_(True), Publ.year > 1950]
    if language != "all":
        filters.append(Publ.language.ilike(f"%{language}%"))

    stmt = select(Publ.id).where(*filters)
    result = await session.execute(stmt)
    return result.scalars().all()


async def user_filled_publication(
    session: AsyncSession, user_id: int, publ_id: int
) -> bool:
    stmt = (
        select(EventRecord.type)
        .where(EventRecord.user_id == user_id, EventRecord.publ_id == publ_id)
        .order_by(EventRecord.created_at.desc())
        .limit(1)
    )

    result = await session.execute(stmt)
    record_type = result.scalar_one_or_none()

    if record_type is None:
        return False

    return record_type == "rec_ok"


async def get_publications_by_ids(
    session: AsyncSession,
    ids: list[int],
) -> Sequence[Publ]:
    stmt = select(Publ).where(Publ.id.in_(ids))
    result = await session.execute(stmt)
    return result.scalars().all()


async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    stmt = select(User).where(User.user_id == user_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()
