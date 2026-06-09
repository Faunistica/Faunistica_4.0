import logging

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def _legacy_scalar(
    session: AsyncSession,
    stmt: object,
    warning_msg: str,
) -> object | None:
    try:
        async with session.begin_nested():
            return await session.scalar(stmt)
    except SQLAlchemyError:
        logger.warning(warning_msg, exc_info=True)
        return None
