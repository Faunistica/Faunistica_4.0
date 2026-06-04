from datetime import datetime

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.enums import PendingStatus
from core.model import PendingRegistration
from service.registration import is_registration_expired


async def create_pending_registration(
    session: AsyncSession,
    *,
    username: str,
    password_hash: str,
    code: str,
    age: int,
    lng: str,
    comm: str,
) -> PendingRegistration:
    pending = PendingRegistration(
        username=username,
        password_hash=password_hash,
        code=code,
        age=age,
        lng=lng,
        comm=comm,
    )
    session.add(pending)
    await session.flush()
    return pending


async def get_pending_by_code(
    session: AsyncSession, code: str
) -> PendingRegistration | None:
    stmt = select(PendingRegistration).where(PendingRegistration.code == code)
    result = await session.execute(stmt)
    pending = result.scalar_one_or_none()

    if pending and is_registration_expired(pending.created_at):
        return None
    return pending


async def get_pending_by_username(
    session: AsyncSession, username: str
) -> PendingRegistration | None:
    stmt = (
        select(PendingRegistration)
        .where(PendingRegistration.username == username)
        .order_by(PendingRegistration.created_at.desc(), PendingRegistration.id.desc())
        .limit(1)
    )
    result = await session.execute(stmt)
    pending = result.scalar_one_or_none()
    if pending and is_registration_expired(pending.created_at):
        return None
    return pending


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


async def delete_expired_pending(session: AsyncSession, cutoff: datetime) -> int:
    stmt = delete(PendingRegistration).where(
        PendingRegistration.status == PendingStatus.PENDING,
        PendingRegistration.created_at < cutoff,
    )
    result = await session.execute(stmt)
    return result.rowcount or 0


async def delete_confirmed_pending(session: AsyncSession, cutoff: datetime) -> int:
    stmt = delete(PendingRegistration).where(
        PendingRegistration.status == PendingStatus.CONFIRMED,
        PendingRegistration.confirmed_at.is_not(None),
        PendingRegistration.confirmed_at < cutoff,
    )
    result = await session.execute(stmt)
    return result.rowcount or 0
