from datetime import datetime

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.enums import PendingStatus
from core.model import PendingRegistration


async def create_pending_registration(
    session: AsyncSession,
    *,
    code: str,
    token: str,
) -> PendingRegistration:
    pending = PendingRegistration(
        token=token,
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


async def get_pending_by_token(
    session: AsyncSession, token: str, populate_existing: bool = False
) -> PendingRegistration | None:
    stmt = select(PendingRegistration).where(PendingRegistration.token == token)
    if populate_existing:
        stmt = stmt.execution_options(populate_existing=True)
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


async def update_pending_by_token(
    session: AsyncSession, token: str, **values: object
) -> PendingRegistration | None:
    stmt = (
        update(PendingRegistration)
        .where(PendingRegistration.token == token)
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
        PendingRegistration.status == PendingStatus.AWAITING_CODE,
        PendingRegistration.token_created_at < cutoff,
    )
    result = await session.execute(stmt)
    return getattr(result, "rowcount", 0)


async def delete_registration_pending(session: AsyncSession, cutoff: datetime) -> int:
    stmt = delete(PendingRegistration).where(
        PendingRegistration.status == PendingStatus.AWAITING_API_REGISTRATION,
        PendingRegistration.reg_run < cutoff,
    )
    result = await session.execute(stmt)
    return getattr(result, "rowcount", 0)


async def delete_confirmed_pending(session: AsyncSession, cutoff: datetime) -> int:
    stmt = delete(PendingRegistration).where(
        PendingRegistration.status == PendingStatus.COMPLETED,
        PendingRegistration.confirmed_at.is_not(None),
        PendingRegistration.confirmed_at < cutoff,
    )
    result = await session.execute(stmt)
    return getattr(result, "rowcount", 0)
