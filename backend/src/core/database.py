import logging
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from core.config import settings
from core.exceptions import DBException
from core.model import Base

logger = logging.getLogger(__name__)


_engine = create_async_engine(
    str(settings.DB_URL), echo=settings.DB_ECHO, pool_pre_ping=True
)
async_session_factory = async_sessionmaker(
    bind=_engine,
    class_=AsyncSession,
    # TODO: add later
    # autoflush=False,
    expire_on_commit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession]:
    async with async_session_factory() as session:
        try:
            yield session
        except IntegrityError as e:
            await session.rollback()
            raise DBException("Database integrity conflict", 409, "DB_CONFLICT") from e
        except OperationalError as e:
            await session.rollback()
            raise DBException("Database unavailable", 503, "DB_UNAVAILABLE") from e
        except SQLAlchemyError as e:
            await session.rollback()
            raise DBException("Database error", 500, "DB_ERROR") from e


async def init_db() -> None:
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def ping_db() -> bool:
    try:
        async with _engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except SQLAlchemyError:
        logger.exception("couldn't ping DB")
        return False
    return True
