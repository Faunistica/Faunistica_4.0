from typing import Annotated

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from core.dependencies import ClientIP, TokenUser
from schema.records import RecordFull
from service.records import RecordService

router = APIRouter(
    prefix="/records",
)


class CreateRecordRequest(BaseModel):
    publ_id: int


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def create_record(
    data: CreateRecordRequest,
    ip: ClientIP,
    token: TokenUser,
    service: Annotated[RecordService, Depends()],
) -> RecordFull:
    return await service.create_record(
        user_id=token.user_id,
        publ_id=data.publ_id,
        ip=ip,
        submission_type="autosave",
    )
