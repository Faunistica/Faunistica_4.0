import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from database.hash import check_password_hash
from database.models import User
from repository import user as user_repo

logger = logging.getLogger(__name__)


class UserService:
    async def get_user_id_by_username(
        self, session: AsyncSession, username: str
    ) -> int | None:
        return await user_repo.get_user_id_by_username(session, username)

    async def is_pass_correct(
        self, session: AsyncSession, user_id: int, user_pass: str
    ) -> bool:
        return await user_repo.is_pass_correct(session, user_id, user_pass)

    async def get_user(self, session: AsyncSession, user_id: int) -> User:
        return await user_repo.get_user(session, user_id)

    async def username_and_publication(
        self, session: AsyncSession, user_id: int
    ) -> dict:
        return await user_repo.username_and_publication(session, user_id)

    async def create_user(
        self, session: AsyncSession, user_id: int, reg_stat: int
    ) -> None:
        await user_repo.create_user(session, user_id, reg_stat)

    async def update_user(
        self,
        session: AsyncSession,
        user_id: int,
        **fields: Any,
    ) -> None:
        await user_repo.update_user(session, user_id, **fields)

    async def count_users_with_name(self, session: AsyncSession, name: str) -> int:
        return await user_repo.count_users_with_name(session, name)

    async def get_user_stats(self, session: AsyncSession, user_id: int) -> dict:
        return await user_repo.get_user_stats(session, user_id)

    async def get_personal_stats(
        self, session: AsyncSession, user_id: int
    ) -> list[dict]:
        return await user_repo.get_personal_stats(session, user_id)

    def verify_password(self, password: str, password_hash: str) -> bool:
        return check_password_hash(password, password_hash)


_user_service: UserService | None = None


def get_user_service() -> UserService:
    global _user_service
    if _user_service is None:
        _user_service = UserService()
    return _user_service
