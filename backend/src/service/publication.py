import logging
from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Publ
from repository import publication as publication_repo

logger = logging.getLogger(__name__)


class PublicationService:
    async def get(self, session: AsyncSession, publ_id: int) -> Publ | None:
        return await publication_repo.get_publication(session, publ_id)

    async def get_for_language(
        self, session: AsyncSession, language: str
    ) -> Sequence[int]:
        return await publication_repo.get_publications_for_language(session, language)

    async def is_filled_by_user(
        self, session: AsyncSession, user_id: int, publ_id: int
    ) -> bool:
        return await publication_repo.is_publ_filled(session, user_id, publ_id)

    async def add(self, session: AsyncSession, publ_json: dict) -> None:
        await publication_repo.add_publication_from_json(session, publ_json)
