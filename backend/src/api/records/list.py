from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query

from core.dependencies import DBSession
from core.security import validate_user_id_query
from repository import record as repo
from schema.common import PaginatedResponse
from schema.records import RecordFull

router = APIRouter(
    prefix="/records",
)


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
