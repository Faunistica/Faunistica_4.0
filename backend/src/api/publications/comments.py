import logging

from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from core.dependencies import ClientIP, DBSession, TokenUser
from core.exceptions import (
    PublicationForbiddernError,
    PublicationNotFoundError,
)
from repository.publication import get_publication
from repository.user import get_user_expect
from service.actions import ActionService

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
    publication = await get_publication(session, publ_id)
    if not publication:
        raise PublicationNotFoundError(publ_id)

    user = await get_user_expect(session, token.user_id)

    print(user.publ_id)
    if user.publ_id != publ_id:
        raise PublicationForbiddernError(publ_id, token.user_id)

    action_service = ActionService(session)
    await action_service.save_action(
        token.user_id, "publ_rem", f"{publ_id}_comm:{data.comment}", ip
    )
