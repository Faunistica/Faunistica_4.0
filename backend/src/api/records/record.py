from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from core.dependencies import ClientIP, DBSession
from core.security import validate_user_id_query
from repository import record as repo
from schema.records import RecordBelonging, RecordData, RecordFull
from service.records import create_record_metadata

router = APIRouter(prefix="/records/{record_id}")


@router.get("")
async def get_record(
    record_id: UUID,
    session: DBSession,
    user_id: Annotated[int, Depends(validate_user_id_query)],
) -> RecordFull:
    record = await repo.get_record(session, record_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found",
        )

    if record.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return RecordFull.model_validate(record.__dict__)


@router.put("")
async def update_record(
    record_id: UUID,
    data: RecordData,
    user_id: Annotated[int, Depends(validate_user_id_query)],
    session: DBSession,
    ip: ClientIP,
) -> RecordFull:
    # Get the current record to check ownership and get updated_at
    current_record = await repo.get_record(session, record_id)
    if not current_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found",
        )

    if current_record.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    metadata = create_record_metadata(
        None,
        RecordBelonging(publ_id=data.publ_id, user_id=user_id),
        "autosave",
        ip=ip,
        # Use the current record's updated_at for optimistic locking
        updated_at=current_record.updated_at,
    )

    record = await repo.update_record(session, record_id, data, metadata)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found or updated by another process",
        )

    return RecordFull.model_validate(record.__dict__)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(
    record_id: UUID,
    session: DBSession,
    user_id: Annotated[int, Depends(validate_user_id_query)],
) -> None:
    deleted = await repo.delete_record(session, record_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found",
        )
