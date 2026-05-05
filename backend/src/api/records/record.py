from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status

from core.dependencies import ClientIP, TokenUser
from schema.records import RecordData, RecordFull
from service.records import RecordService

router = APIRouter(prefix="/records/{record_id}")


@router.get("")
async def get_record(
    record_id: UUID,
    service: Annotated[RecordService, Depends()],
) -> RecordFull:
    return await service.get_record(
        record_id=record_id,
    )


@router.put("")
async def update_record(
    record_id: UUID,
    data: RecordData,
    user: TokenUser,
    ip: ClientIP,
    service: Annotated[RecordService, Depends()],
) -> RecordFull:
    return await service.update_record(
        record_id=record_id,
        user_id=user.user_id,
        data=data,
        ip=ip,
    )


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(
    record_id: UUID,
    token: TokenUser,
    service: Annotated[RecordService, Depends()],
) -> None:
    await service.delete_record(
        record_id=record_id,
        user_id=token.user_id,
    )
