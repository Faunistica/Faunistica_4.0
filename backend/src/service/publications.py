import logging
from typing import Annotated

from fastapi import Depends
from sqlalchemy import update

from core import model
from core.dependencies import DBSession
from core.exceptions import (
    NoPublicationsAssignedError,
    PublicationForbiddenError,
    PublicationNotFoundError,
)
from core.model import User
from repository.publication import (
    get_publication,
    get_publication_expect,
    get_publications_by_ids,
)
from repository.user import get_user_expect
from schema.common import ProcessingLevel, Publication
from service.actions import ActionService

logger = logging.getLogger(__name__)


class PublicationService:
    def __init__(
        self,
        session: DBSession,
        action_service: Annotated[ActionService, Depends()],
    ) -> None:
        self.session = session
        self.actions = action_service

    def _get_current_publ_id(self, user: User) -> int | None:
        """Return items[0] as current publ_id, or None if items is empty."""
        queue = self._pipe_to_array(user.items) if user.items else []
        return queue[0] if queue else None

    async def validate_access(
        self,
        publ: int | model.Publication,
        *,
        user_id: int | None = None,
        user: User | None = None,
    ) -> Publication:
        if isinstance(publ, int):
            publ_db = await get_publication(self.session, publ)

            if publ_db is None:
                logger.info(
                    "user %d requested access non-existend publication %d",
                    user_id,
                    publ,
                )
                raise PublicationNotFoundError(publ)
        else:
            publ_db = publ

        publ_id = publ_db.publ_id

        if user is None:
            if user_id is None:
                raise ValueError("both user and user_id are None")
            user = await get_user_expect(self.session, user_id)

        user_id = user.user_id
        current_publ_id = self._get_current_publ_id(user)

        if current_publ_id is None:
            raise NoPublicationsAssignedError(user_id)

        if current_publ_id != publ_id:
            raise PublicationForbiddenError(user_id, publ_id)

        return Publication.model_validate(publ_db)

    async def complete(
        self,
        user_id: int,
        publ_id: int,
        level: ProcessingLevel,
        ip: str | None,
    ) -> Publication | None:
        user = await get_user_expect(self.session, user_id)
        await self.validate_access(publ_id, user=user)

        await self.actions.log_publ_complete(user_id, level, publ_id, ip)

        # Advance queue: items includes current at position 0, pop it
        queue = self._pipe_to_array(user.items) if user.items else []
        if queue:
            if queue[0] != publ_id:
                logger.warning(
                    "user %d completed publ %d but queue head is %d;"
                    "validation passed, popping anyway",
                    user_id,
                    publ_id,
                    queue[0],
                )
            queue.pop(0)

        new_items = self._array_to_pipe(queue)
        next_publ_id = queue[0] if queue else None

        stmt = update(User).where(User.user_id == user_id).values(items=new_items)
        await self.session.execute(stmt)

        if next_publ_id is None:
            return None

        next_publ = await get_publication_expect(self.session, next_publ_id)
        return Publication.model_validate(next_publ)

    async def assign_current(self, user_id: int) -> Publication | None:
        """Return current publication from items[0], or None if queue empty."""
        user = await get_user_expect(self.session, user_id)
        current_publ_id = self._get_current_publ_id(user)

        if current_publ_id is None:
            return None

        publ = await get_publication_expect(self.session, current_publ_id)
        return Publication.model_validate(publ)

    async def get_current(
        self,
        *,
        user: User | None = None,
        user_id: int | None = None,
        with_queue: bool = False,
    ) -> list[Publication]:
        if user is None:
            if user_id is None:
                raise ValueError("both user and user_id are None")
            user = await get_user_expect(self.session, user_id)

        publ_ids = self._pipe_to_array(user.items) if user.items else []

        if not with_queue:
            if not publ_ids:
                return []
            publ = await get_publication_expect(self.session, publ_ids[0])
            return [Publication.model_validate(publ)]

        if not publ_ids:
            return []

        publications = await get_publications_by_ids(self.session, publ_ids)
        return [Publication.model_validate(p) for p in publications]

    def _pipe_to_array(self, pipe_str: str) -> list[int]:
        """Convert '123|456|789' to [123, 456, 789]"""
        if not pipe_str:
            return []
        return [int(x) for x in pipe_str.split("|") if x.strip()]

    def _array_to_pipe(self, arr: list[int]) -> str:
        """Convert [123, 456, 789] to '123|456|789'"""
        return "|".join(str(x) for x in arr)
