import logging

from fastapi import APIRouter, status
from pydantic import BaseModel

from core.dependencies import ClientIP, DBSession, TokenUser
from core.exceptions import PublicationForbiddernError
from repository.user import get_user_expect, update_user
from schema.common import ProcessingLevel
from schema.user import UserUpdate
from service.actions import ActionService
from service.publications import array_to_pipe, pipe_to_array

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/publications")


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
    """
    Will only work for submitting current publication
    """

    user = await get_user_expect(session, token.user_id)
    if user.publ_id != publ_id:
        raise PublicationForbiddernError(publ_id, token.user_id)

    queue = pipe_to_array(user.items)

    action_service = ActionService(session)
    await action_service.log_publ_complete(
        token.user_id, data.processing_level, publ_id, ip
    )

    next = queue.pop(0) if len(queue) > 0 else None
    new_items = array_to_pipe(queue)
    await update_user(
        session,
        token.user_id,
        UserUpdate(
            publ_id=next,
            items=new_items,
        ),
    )
