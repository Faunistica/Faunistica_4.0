from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import PendingRegistration


async def create_pending_registration(
    session: AsyncSession,
    *,
    username: str,
    password_hash: str,
    code: str,
) -> PendingRegistration:
    pending = PendingRegistration(
        username=username,
        password_hash=password_hash,
        code=code,
    )
    session.add(pending)
    await session.flush()
    return pending


async def get_pending_by_code(
    session: AsyncSession, code: str
) -> PendingRegistration | None:
    stmt = select(PendingRegistration).where(PendingRegistration.code == code)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_pending_by_username(
    session: AsyncSession, username: str
) -> PendingRegistration | None:
    stmt = select(PendingRegistration).where(PendingRegistration.username == username)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def update_pending_by_code(
    session: AsyncSession, code: str, **values: object
) -> PendingRegistration | None:
    stmt = (
        update(PendingRegistration)
        .where(PendingRegistration.code == code)
        .values(**values)
        .returning(PendingRegistration)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def delete_pending_by_code(session: AsyncSession, code: str) -> None:
    stmt = delete(PendingRegistration).where(PendingRegistration.code == code)
    await session.execute(stmt)
