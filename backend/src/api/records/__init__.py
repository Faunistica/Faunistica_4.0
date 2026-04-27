from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from core.dependencies import ClientIP, DBSession, TokenUser
from core.security import validate_user_id_query
from repository import record as repo
from schema.common import PaginatedResponse
from schema.records import RecordBelonging, RecordData, RecordFull
from service.records import (
    create_record_metadata,
)

router = APIRouter(prefix="/records", tags=["records"])


@router.get("")
async def list_records(
    session: DBSession,
    user_id: Annotated[int, Depends(validate_user_id_query)],
    publ_id: Annotated[int, Query(description="Publication ID")],
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Page size")] = 20,
    sort: Annotated[
        Literal["created_at", "updated_at"],
        Query(description="Sort field"),
    ] = "created_at",
) -> PaginatedResponse[RecordFull]:
    records, total = await repo.get_records_paginated(
        session=session,
        user_id=user_id,
        publ_id=publ_id,
        page=page,
        page_size=page_size,
        sort=sort,
    )

    pages = (total + page_size - 1) // page_size if page_size > 0 else 0

    return PaginatedResponse(
        items=[RecordFull.model_validate(r.__dict__) for r in records],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def create_record(
    belonging: RecordBelonging,
    session: DBSession,
    ip: ClientIP,
    token: TokenUser,
) -> RecordFull:
    if token.user_id != belonging.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    metadata = create_record_metadata(None, belonging, "autosave", ip)
    db_record = await repo.create_record(session, metadata)

    return RecordFull.model_validate(db_record.__dict__)


@router.get("/{record_id}")
async def get_record_endpoint(
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


@router.put("/{record_id}")
async def update_record_endpoint(
    record_id: UUID,
    data: RecordData,
    user_id: Annotated[int, Depends(validate_user_id_query)],
    session: DBSession,
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
        ip=None,
    )
    # Use the current record's updated_at for optimistic locking
    metadata.updated_at = current_record.updated_at

    record = await repo.update_record(session, record_id, data, metadata)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found or updated by another process",
        )

    return RecordFull.model_validate(record.__dict__)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record_endpoint(
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
