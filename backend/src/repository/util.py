import logging

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.selectable import TypedReturnsRows

logger = logging.getLogger(__name__)


async def _legacy_scalar[T](
    session: AsyncSession,
    stmt: TypedReturnsRows[tuple[T]],
    warning_msg: str,
) -> T | None:
    """
    Runs stmt and returns None if it fails
    Intended to use for queries that use legacy 'records' table
    """
    try:
        async with session.begin_nested():
            return await session.scalar(stmt)
    except SQLAlchemyError:
        logger.warning(warning_msg, exc_info=True)
        return None
