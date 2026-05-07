import logging
from typing import Annotated

from fastapi import Depends
from sqlalchemy import update

from core.dependencies import DBSession, TokenUser
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

    async def validate_access(
        self, publ_id: int, *, user_id: int | None = None, user: User | None = None
    ) -> None:
        """Raises PublicationForbiddenError if user.publ_id != publ_id."""
        # Check if publication exists
        if await get_publication(self.session, publ_id) is None:
            logger.info(
                "user %d requested access non-existend publication %d", user_id, publ_id
            )
            raise PublicationNotFoundError(publ_id)

        if user is None:
            if user_id is None:
                raise ValueError("both user and user_id are None")
            user = await get_user_expect(self.session, user_id)

        user_id = user.user_id

        if user.publ_id is None:
            raise NoPublicationsAssignedError(user_id)

        if user.publ_id != publ_id:
            raise PublicationForbiddenError(publ_id, user_id)

    async def complete(
        self,
        user_id: int,
        publ_id: int,
        level: ProcessingLevel,
        ip: str | None,
    ) -> Publication | None:
        """
        Single transaction: validate access, log action, advance queue,
        update user.publ_id and user.items, commit.
        Returns the next publication after advancing, or None if queue empty.
        """
        user = await get_user_expect(self.session, user_id)
        await self.validate_access(publ_id, user=user)

        # Log action (no commit - part of same transaction)
        await self.actions.log_publ_complete(user_id, level, publ_id, ip)

        # Advance queue
        queue = self._pipe_to_array(user.items) if user.items else []

        # Remove publ_id from queue if it's at the front
        if queue and queue[0] == publ_id:
            queue.pop(0)

        next_publ_id = queue[0] if queue else None
        new_items = self._array_to_pipe(queue)

        stmt = (
            update(User)
            .where(User.user_id == user_id)
            .values(publ_id=next_publ_id, items=new_items)
        )
        await self.session.execute(stmt)
        await self.session.commit()

        if next_publ_id is None:
            return None

        next_publ = await get_publication_expect(self.session, next_publ_id)
        return Publication.model_validate(next_publ)

    # FIXME: remove
    async def assign_current(self, user_id: int) -> Publication | None:
        """
        Assign next publication from queue if user.publ_id is None.
        Returns the assigned publication or None if queue empty.
        """
        user = await get_user_expect(self.session, user_id)

        if user.publ_id is not None:
            publ = await get_publication_expect(self.session, user.publ_id)
            return Publication.model_validate(publ)

        queue = self._pipe_to_array(user.items) if user.items else []
        if not queue:
            return None

        next_publ_id = queue[0]

        # Update user's publ_id
        stmt = update(User).where(User.user_id == user_id).values(publ_id=next_publ_id)
        await self.session.execute(stmt)
        await self.session.commit()

        publ = await get_publication_expect(self.session, next_publ_id)
        return Publication.model_validate(publ)

    async def get_current(
        self,
        token_user: TokenUser,
        with_queue: bool = False,
    ) -> list[Publication]:
        """Parse queue, resolve publ_ids, return publications."""
        user_id = token_user.user_id
        user = await get_user_expect(self.session, user_id)

        if not with_queue:
            # Return only current publication
            if user.publ_id is None:
                return []

            publ = await get_publication_expect(self.session, user.publ_id)
            return [Publication.model_validate(publ)]

        # Return all: current + queue
        publ_ids: list[int] = [user.publ_id] if user.publ_id else []
        queue = self._pipe_to_array(user.items) if user.items else []
        publ_ids.extend(queue)

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
