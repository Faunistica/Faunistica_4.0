import logging

from fastapi import APIRouter, status
from pydantic import BaseModel, Field, field_validator

from core.dependencies import ClientIP, DBSession, TokenUser
from core.exceptions import PublicationNotFoundError
from repository.user import get_user
from service.actions import ActionService
from service.publications import pipe_to_array

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/publications")


class PublicationComment(BaseModel):
    comment: str = Field(min_length=10)


@router.post("/{publ_id}/comments", status_code=status.HTTP_204_NO_CONTENT)
async def add_publication_comment(
    publ_id: int,
    data: PublicationComment,
    session: DBSession,
    token: TokenUser,
    ip: ClientIP,
) -> None:
    user = await get_user(session, token.user_id)
    if not user:
        raise PublicationNotFoundError(publ_id)

    queue = pipe_to_array(user.items)

    if not queue or publ_id not in queue:
        raise PublicationNotFoundError(publ_id)

    action_service = ActionService(session)
    await action_service.save_action(
        token.user_id, "publ_rem", f"{publ_id}_comm:{data.comment}", ip
    )
