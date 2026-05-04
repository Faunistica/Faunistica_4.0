import logging
from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.exceptions import ExpectationError
from core.model import EventRecord, Publication, User

logger = logging.getLogger(__name__)


async def get_publication(session: AsyncSession, publ_id: int) -> Publication | None:
    stmt = select(Publication).where(Publication.id == publ_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_publication_expect(session: AsyncSession, publ_id: int) -> Publication:
    publ = await get_publication(session, publ_id)

    if publ is None:
        logger.error("Expected tp find publication in DB: %d", publ_id)
        raise ExpectationError(message=f"Expected to publication to exist: {publ_id}")

    return publ


async def get_publications_for_language(
    session: AsyncSession, language: str
) -> Sequence[int]:
    filters = [
        Publication.ural.is_(True),
        Publication.coords.is_(True),
        Publication.year > 1950,
    ]
    if language != "all":
        filters.append(Publication.language.ilike(f"%{language}%"))

    stmt = select(Publication.id).where(*filters)
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
) -> Sequence[Publication]:
    stmt = select(Publication).where(Publication.id.in_(ids))
    result = await session.execute(stmt)
    return result.scalars().all()


async def get_user_publication(
    session: AsyncSession, user_id: int
) -> Publication | None:
    stmt = select(Publication).join(User).where(User.user_id == user_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()
