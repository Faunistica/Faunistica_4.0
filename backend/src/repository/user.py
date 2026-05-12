import logging
from datetime import datetime

from sqlalchemy import func, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.enums import UserState
from core.exceptions import ExpectationError
from core.model import User
from schema.user import UserUpdate

logger = logging.getLogger(__name__)


async def find_user_by_username(session: AsyncSession, username: str) -> User | None:
    stmt = select(User).where(User.name == username)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_expect(session: AsyncSession, user_id: int) -> User:
    user = await get_user(session, user_id)
    if user is None:
        logger.error("Expected tp find user in DB: %d", user_id)
        raise ExpectationError(message=f"Expected to find user: {user_id}")

    return user


async def get_user(session: AsyncSession, user_id: int) -> User | None:
    stmt = select(User).where(User.user_id == user_id)
    result = await session.execute(stmt)

    return result.scalar_one_or_none()


async def create_user_or_update(
    session: AsyncSession, user_id: int, reg_stat: UserState = UserState.REG_AGREEMENT
) -> User:
    stmt = insert(User).values(user_id=user_id, reg_stat=reg_stat)
    stmt = stmt.on_conflict_do_update(
        index_elements=[User.user_id],
        set_={User.reg_stat: stmt.excluded.reg_stat, User.reg_run: datetime.now()},
    ).returning(User)
    result = await session.execute(stmt)

    return result.scalar_one()


async def update_user(
    session: AsyncSession, user_id: int, data: UserUpdate
) -> User | None:
    stmt = (
        update(User)
        .where(User.user_id == user_id)
        .values(**data.model_dump(exclude_unset=True))
        .returning(User)
    )
    result = await session.execute(stmt)

    return result.scalar_one_or_none()


async def count_users_with_name(session: AsyncSession, name: str) -> int:
    stmt = select(func.count()).select_from(User).where(User.name == name)
    result = await session.execute(stmt)
    return result.scalar_one()
