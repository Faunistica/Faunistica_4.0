import logging
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from core.config import settings
from core.model import Base

logger = logging.getLogger(__name__)


_engine = create_async_engine(str(settings.DB_URL), echo=settings.DB_ECHO)
_async_session_local = async_sessionmaker(
    bind=_engine,
    class_=AsyncSession,
    # TODO: add later
    # autoflush=False,
    expire_on_commit=False,
)


class DBException(Exception):
    pass


async def get_session() -> AsyncGenerator[AsyncSession]:
    async with _async_session_local() as session:
        try:
            yield session
        except IntegrityError as e:
            await session.rollback()
            logger.error("IntegrityError", exc_info=True)
            raise DBException from e
        except SQLAlchemyError as e:
            await session.rollback()
            logger.error("SQLAlchemyError", exc_info=True)
            raise DBException from e


async def init_db() -> None:
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def ping_db() -> bool:
    try:
        async with _engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        logger.exception("couldn't ping DB")
        return False
    return True
