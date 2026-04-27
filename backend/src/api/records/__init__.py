from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import UUID6

from core.dependencies import ClientIP, DBSession
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
    publ_id: Annotated[int, Query(..., description="Publication ID")],
    page: Annotated[int, Query(1, ge=1, description="Page number")],
    page_size: Annotated[int, Query(20, ge=1, le=100, description="Page size")],
    sort: Annotated[
        Literal["created_at", "updated_at"],
        Query("created_at", description="Sort field"),
    ],
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
        items=[RecordFull.model_validate(r) for r in records],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(validate_user_id_query)],
)
async def create_record(
    belonging: RecordBelonging,
    session: DBSession,
    ip: ClientIP,
) -> RecordFull:
    metadata = create_record_metadata(None, belonging, "autosave", ip)
    db_record = await repo.create_record(session, metadata)

    return RecordFull.model_validate(db_record)


@router.get("/{record_id}")
async def get_record_endpoint(
    record_id: UUID6,
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

    return RecordFull.model_validate(record)


@router.put("/{record_id}")
async def update_record_endpoint(
    record_id: UUID6,
    data: RecordData,
    user_id: Annotated[int, Depends(validate_user_id_query)],
    session: DBSession,
) -> RecordFull:
    metadata = create_record_metadata(
        None,
        RecordBelonging(publ_id=data.publ_id, user_id=user_id),
        "autosave",
        ip=None,
    )
    record = await repo.update_record(session, record_id, data, metadata)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found",
        )

    return RecordFull.model_validate(record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record_endpoint(
    record_id: str,
    session: DBSession,
    user_id: Annotated[int, Depends(validate_user_id_query)],
) -> None:
    try:
        uuid = UUID(record_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid record ID",
        ) from exc

    deleted = await repo.delete_record(session, uuid, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found",
        )
