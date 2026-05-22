from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from core.dependencies import ClientIP, TokenUser
from schema.records import RecordData, RecordFull
from service.records import RecordService
from service.records.validation.errors import ErrorCollection, RecordValidationError

router = APIRouter(prefix="/records/{record_id}")


class UpdateRecordResponse(BaseModel):
    record: RecordFull
    errors: list[RecordValidationError]

    @classmethod
    def create(
        cls, record: RecordFull, errors: ErrorCollection
    ) -> "UpdateRecordResponse":
        return UpdateRecordResponse(record=record, errors=errors.to_list())


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
) -> UpdateRecordResponse:
    record, errors = await service.update_record(
        record_id=record_id,
        user_id=user.user_id,
        data=data,
        ip=ip,
    )

    return UpdateRecordResponse.create(record, errors)


@router.put("/submit")
async def submit_record(
    record_id: UUID,
    data: RecordData,
    user: TokenUser,
    ip: ClientIP,
    service: Annotated[RecordService, Depends()],
) -> UpdateRecordResponse:
    record, errors = await service.update_record(
        record_id=record_id,
        user_id=user.user_id,
        data=data,
        ip=ip,
        submission_type="submit",
    )

    return UpdateRecordResponse.create(record, errors)


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
