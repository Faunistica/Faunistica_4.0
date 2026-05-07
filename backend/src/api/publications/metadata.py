import logging
from typing import Annotated

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from core.dependencies import (
    ClientIP,
    TokenUser,
)
from service.actions import ActionService
from service.publications import PublicationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/publications")


class PublicationMetadata(BaseModel):
    urals_scope: str | None = None
    material_status: str | None = None


@router.post("/{publ_id}/metadata", status_code=status.HTTP_204_NO_CONTENT)
async def set_publication_metadata(
    publ_id: int,
    data: PublicationMetadata,
    token: TokenUser,
    ip: ClientIP,
    pub_service: Annotated[PublicationService, Depends()],
    action_service: Annotated[ActionService, Depends()],
) -> None:
    await pub_service.validate_access(publ_id, user_id=token.user_id)
    await action_service.log_publ_metadata(
        token.user_id, publ_id, data.urals_scope, data.material_status, ip
    )
