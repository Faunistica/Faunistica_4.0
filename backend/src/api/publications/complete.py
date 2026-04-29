import logging
from enum import StrEnum

from fastapi import APIRouter, status
from pydantic import BaseModel

from core.dependencies import ClientIP, DBSession, TokenUser
from core.exceptions import PublicationNotFoundError
from repository import publication as repo
from repository.user import get_user
from service.actions import ActionService
from service.publications import pipe_to_array

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/publications")


class ProcessingLevel(StrEnum):
    FULL = "full"
    URAL = "ural"
    PART = "part"
    SKIP = "skip"


class PublicationComplete(BaseModel):
    processing_level: ProcessingLevel


@router.post("/{publ_id}/complete", status_code=status.HTTP_204_NO_CONTENT)
async def complete_publication(
    publ_id: int,
    data: PublicationComplete,
    session: DBSession,
    token: TokenUser,
    ip: ClientIP,
) -> None:
    user = await get_user(session, token.user_id)
    if not user:
        raise PublicationNotFoundError(publ_id)

    queue = pipe_to_array(user.items)

    if not queue or queue[0] != publ_id:
        raise PublicationNotFoundError(publ_id)

    action_map = {
        ProcessingLevel.FULL: "publ_end_full",
        ProcessingLevel.URAL: "publ_end_ural",
        ProcessingLevel.PART: "publ_end_part",
        ProcessingLevel.SKIP: "publ_end_skip",
    }
    action_type = action_map[data.processing_level]

    action_service = ActionService(session)
    await action_service.save_action(token.user_id, action_type, str(publ_id), ip)

    queue.pop(0)
    new_items = "|".join(str(x) for x in queue)
    await repo.update_user_items(session, token.user_id, new_items)
