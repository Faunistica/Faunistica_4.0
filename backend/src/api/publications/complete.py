from typing import Annotated

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from core.dependencies import ClientIP, TokenUser
from schema.common import ProcessingLevel
from service.publications import PublicationService

router = APIRouter(prefix="/publications")


class PublicationComplete(BaseModel):
    processing_level: ProcessingLevel


@router.post("/{publ_id}/complete", status_code=status.HTTP_204_NO_CONTENT)
async def complete_publication(
    publ_id: int,
    data: PublicationComplete,
    token: TokenUser,
    ip: ClientIP,
    pub_service: Annotated[PublicationService, Depends()],
) -> None:
    await pub_service.complete(token.user_id, publ_id, data.processing_level, ip)
