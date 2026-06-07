import logging
from typing import Annotated

from fastapi import Depends
from sqlalchemy import or_, select, update

from core import model
from core.config import settings
from core.dependencies import DBSession
from core.enums import RecordType
from core.exceptions import (
    NoPublicationsAssignedError,
    PublicationForbiddenError,
    PublicationNotFoundError,
    UnsubmittedRecordsError,
)
from core.model import EventRecord, User
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

    @staticmethod
    def _is_interactable(publ_id: int, queue: list[int]) -> bool:
        count = settings.INTERACTABLE_QUEUE_COUNT
        if count == 0:
            return publ_id in queue
        return publ_id in queue[:count]

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
        queue = self._pipe_to_array(user.items) if user.items else []

        if not queue:
            raise NoPublicationsAssignedError(user_id)

        if not self._is_interactable(publ_id, queue):
            raise PublicationForbiddenError(user_id, publ_id)

        return Publication.model_validate(publ_db)

    async def _advance_queue(
        self,
        user_id: int,
        publ_id: int,
        level: ProcessingLevel,
        ip: str | None,
    ) -> Publication | None:
        await self.actions.log_publ_complete(user_id, level, publ_id, ip)

        user = await get_user_expect(self.session, user_id)
        queue = self._pipe_to_array(user.items) if user.items else []
        if publ_id in queue:
            queue.remove(publ_id)

        new_items = self._array_to_pipe(queue)
        next_publ_id = queue[0] if queue else None

        stmt = update(User).where(User.user_id == user_id).values(items=new_items)
        await self.session.execute(stmt)

        if next_publ_id is None:
            return None

        next_publ = await get_publication_expect(self.session, next_publ_id)
        return Publication.model_validate(next_publ)

    async def get_draft_record_ids(self, user_id: int, publ_id: int) -> list[str]:
        stmt = (
            select(EventRecord.id)
            .where(
                EventRecord.user_id == user_id,
                EventRecord.publ_id == publ_id,
                or_(
                    EventRecord.type.in_([RecordType.CHECK_OK, RecordType.CHECK_FAIL]),
                    EventRecord.type.is_(None),
                ),
            )
            .order_by(EventRecord.created_at.desc(), EventRecord.id)
        )
        result = await self.session.execute(stmt)
        return [str(row[0]) for row in result.all()]

    async def submit(
        self,
        user_id: int,
        publ_id: int,
        level: ProcessingLevel,
        urals_scope: str | None,
        material_status: str | None,
        comment: str | None,
        ip: str | None,
    ) -> None:
        await self.validate_access(publ_id, user_id=user_id)

        draft_ids = await self.get_draft_record_ids(user_id, publ_id)
        if draft_ids:
            raise UnsubmittedRecordsError(draft_ids)

        if level in (ProcessingLevel.FULL, ProcessingLevel.URAL):
            stmt = (
                update(model.Publication)
                .where(model.Publication.publ_id == publ_id)
                .values(cover=model.Publication.cover + 1)
            )
            await self.session.execute(stmt)

        if urals_scope or material_status:
            await self.actions.log_publ_metadata(
                user_id, publ_id, urals_scope, material_status, ip
            )

        if comment:
            await self.actions.log_publ_comment(user_id, publ_id, comment, ip)

        await self._advance_queue(user_id, publ_id, level, ip)
        await self.session.commit()

    async def assign_current(self, user_id: int) -> Publication | None:
        """Return current publication from items[0], or None if queue empty."""
        user = await get_user_expect(self.session, user_id)
        queue = self._pipe_to_array(user.items) if user.items else []

        if not queue:
            return None

        publ = await get_publication_expect(self.session, queue[0])
        return Publication.model_validate(publ)

    async def get(self, publ_id: int, user_id: int) -> Publication:
        return await self.validate_access(publ_id, user_id=user_id)

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
            pub = Publication.model_validate(publ)
            pub.interactable = self._is_interactable(pub.publ_id, publ_ids)
            return [pub]

        if not publ_ids:
            return []

        publications = await get_publications_by_ids(self.session, publ_ids)
        publ_map = {p.publ_id: p for p in publications}
        results: list[Publication] = []
        for pid in publ_ids:
            p = publ_map.get(pid)
            if p is None:
                continue
            pub = Publication.model_validate(p)
            pub.interactable = self._is_interactable(pub.publ_id, publ_ids)
            results.append(pub)
        return results

    def _pipe_to_array(self, pipe_str: str) -> list[int]:
        """Convert '123|456|789' to [123, 456, 789]"""
        if not pipe_str:
            return []
        return [int(x) for x in pipe_str.split("|") if x.strip()]

    def _array_to_pipe(self, arr: list[int]) -> str:
        """Convert [123, 456, 789] to '123|456|789'"""
        return "|".join(str(x) for x in arr)
