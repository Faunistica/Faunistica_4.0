import logging
from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import StatisticsResponse
from database.models import Record
from model import PublData
from repository import record as record_repo

logger = logging.getLogger(__name__)


class RecordService:
    async def add(self, session: AsyncSession, record_json: dict) -> None:
        await record_repo.add_record_from_json(session, record_json)

    async def get_stats(self, session: AsyncSession) -> StatisticsResponse:
        # FIXME:
        return await record_repo.get_statistics(session)  # ty:ignore[invalid-return-type]

    async def get_by_user(
        self, session: AsyncSession, user_id: int
    ) -> Sequence[Record]:
        return await record_repo.get_user_records(session, user_id)

    async def delete(self, session: AsyncSession, record_id: int, user_id: int) -> bool:
        return await record_repo.remove_record_row_by_id(session, record_id, user_id)

    async def get(
        self, session: AsyncSession, record_id: int, user_id: int
    ) -> Record | None:
        return await record_repo.get_record_by_id(session, record_id, user_id)

    async def update(
        self, session: AsyncSession, record_id: int, user_id: int, new_data: dict
    ) -> bool:
        return await record_repo.edit_record_by_id(
            session, record_id, user_id, new_data
        )

    async def get_publication_by_hash(
        self, session: AsyncSession, record_id: int, user_id: int
    ) -> PublData | None:
        return await record_repo.publ_by_hash(session, record_id, user_id)
