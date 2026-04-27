import logging
from datetime import datetime

from sqlalchemy import func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.model import Publ, User
from core.security import check_password_hash
from schema.user import UserUpdate

logger = logging.getLogger(__name__)


async def find_user_by_username(session: AsyncSession, username: str) -> User | None:
    stmt = select(User).where(User.name == username)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def is_password_correct(
    session: AsyncSession, user_id: int, user_pass: str
) -> bool:
    stmt = select(User.hash).where(User.user_id == user_id)
    result = await session.execute(stmt)
    user_hash = result.scalar_one_or_none()

    if user_hash is None:
        logger.warning("trying to check password for user without one: id: %d", user_id)
        return False

    return check_password_hash(user_pass, user_hash)


async def get_user_unsafe(session: AsyncSession, user_id: int) -> User:
    """
    THIS METHOD WILL THROW IN USER DOESN'T EXIST
    ONLY USE IN TELEGRAM BOT
    """

    stmt = select(User).where(User.user_id == user_id)
    result = await session.execute(stmt)

    # NOTE: i'm not sure if this is better then before
    # maybe some more robust error handling is required here and in similar places
    return result.scalar_one()


async def get_user(session: AsyncSession, user_id: int) -> User | None:
    stmt = select(User).where(User.user_id == user_id)
    result = await session.execute(stmt)

    return result.scalar_one_or_none()


async def get_current_publication(session: AsyncSession, user_id: int) -> Publ | None:
    stmt = (
        select(Publ).join(User, User.publ_id == Publ.id).where(User.user_id == user_id)
    )
    result = await session.execute(stmt)

    return result.scalar_one_or_none()


async def create_user(session: AsyncSession, user_id: int, reg_stat: int) -> None:
    user = User(id=user_id, reg_stat=reg_stat, reg_run=datetime.now())
    session.add(user)

    await session.commit()


async def update_user(session: AsyncSession, user_id: int, data: UserUpdate) -> None:
    stmt = (
        update(User)
        .where(User.user_id == user_id)
        .values(**data.model_dump(exclude_unset=True))
    )
    await session.execute(stmt)
    await session.commit()


async def count_users_with_name(session: AsyncSession, name: str) -> int:
    stmt = select(func.count()).select_from(User).where(User.name == name)
    result = await session.execute(stmt)
    return result.scalar_one()
