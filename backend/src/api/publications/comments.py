import logging
from typing import Annotated

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field

from core.dependencies import (
    ClientIP,
    TokenUser,
)
from service.actions import ActionService
from service.publications import PublicationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/publications")


class PublicationComment(BaseModel):
    comment: str = Field(min_length=10)


@router.post("/{publ_id}/comments", status_code=status.HTTP_204_NO_CONTENT)
async def add_publication_comment(
    publ_id: int,
    data: PublicationComment,
    token: TokenUser,
    ip: ClientIP,
    pub_service: Annotated[PublicationService, Depends()],
    action_service: Annotated[ActionService, Depends()],
) -> None:
    await pub_service.validate_access(token.user_id, publ_id)
    await action_service.log_publ_comment(token.user_id, publ_id, data.comment, ip)
