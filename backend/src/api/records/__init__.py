from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy.future import select

from core.dependencies import ClientIP, DBSession, TokenUser
from core.model import EventRecord
from repository.record import (
    create_record,
    delete_record,
    get_record,
    get_records_paginated,
    update_record,
)
from schemas.common import PaginatedResponse
from schemas.records import RecordCreate, RecordFull, RecordUpdate
from service.records import mock_determine_type, mock_validate_record

router = APIRouter(prefix="/records", tags=["records"])


@router.get("")
async def list_records(
    session: DBSession,
    token: TokenUser,
    user_id: Annotated[int, Query(..., description="User ID")],
    publ_id: Annotated[int, Query(..., description="Publication ID")],
    page: Annotated[int, Query(1, ge=1, description="Page number")],
    page_size: Annotated[int, Query(20, ge=1, le=100, description="Page size")],
    sort: Annotated[str, Query("created_at", description="Sort field")],
) -> PaginatedResponse[RecordFull]:
    if user_id != token.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    records, total = await get_records_paginated(
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


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_record_endpoint(
    record: RecordCreate,
    token: TokenUser,
    session: DBSession,
    ip: ClientIP,
) -> RecordFull:
    if record.user_id != token.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    errors = mock_validate_record(RecordUpdate.model_validate(record.model_dump()))
    record_type = mock_determine_type(errors)

    db_record = await create_record(
        session=session,
        record=record,
        ip=ip,
    )

    stmt = select(EventRecord).where(EventRecord.id == db_record.id)
    result = await session.execute(stmt)
    created = result.scalar_one()

    created.errors = errors
    created.type = record_type

    await session.commit()
    await session.refresh(created)

    return RecordFull.model_validate(created)


@router.get("/{record_id}")
async def get_record_endpoint(
    record_id: str,
    session: DBSession,
    token: TokenUser,
    user_id: Annotated[int, Query(..., description="User ID")],
) -> RecordFull:
    if user_id != token.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    try:
        uuid = UUID(record_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid record ID",
        ) from exc

    record = await get_record(session, uuid, user_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found",
        )

    return RecordFull.model_validate(record)


@router.put("/{record_id}")
async def update_record_endpoint(
    record_id: str,
    record: RecordUpdate,
    token: TokenUser,
    session: DBSession,
) -> RecordFull:
    if record.user_id != token.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    try:
        uuid = UUID(record_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid record ID",
        ) from exc

    existing = await get_record(session, uuid)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found",
        )

    errors = mock_validate_record(record)
    record_type = mock_determine_type(errors)

    await update_record(session, uuid, record, type=record_type, errors=errors)

    updated = await get_record(session, uuid, record.user_id)
    return RecordFull.model_validate(updated)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record_endpoint(  # noqa: PLR0913,FAST002
    record_id: str,
    session: DBSession,
    token: TokenUser,
    user_id: Annotated[int, Query(..., description="User ID")],
) -> None:
    if user_id != token.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    try:
        uuid = UUID(record_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid record ID",
        ) from exc

    deleted = await delete_record(session, uuid, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found",
        )
