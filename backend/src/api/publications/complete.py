from fastapi import APIRouter, status
from pydantic import BaseModel

from core.dependencies import ClientIP, PublicationServiceDep, TokenUser
from schema.common import ProcessingLevel

router = APIRouter(prefix="/publications")


class PublicationComplete(BaseModel):
    processing_level: ProcessingLevel


@router.post("/{publ_id}/complete", status_code=status.HTTP_204_NO_CONTENT)
async def complete_publication(
    publ_id: int,
    data: PublicationComplete,
    token: TokenUser,
    ip: ClientIP,
    pub_service: PublicationServiceDep,
) -> None:
    await pub_service.complete(token, publ_id, data.processing_level, ip)
