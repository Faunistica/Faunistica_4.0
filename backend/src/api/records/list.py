from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import UUID4

from core.dependencies import TokenUser
from schema.common import PaginatedResponse
from schema.records import RecordFull
from service.records import RecordService

router = APIRouter(
    prefix="/records",
)


@router.get("")
async def list_records(
    service: Annotated[RecordService, Depends()],
    token: TokenUser,
    publ_id: Annotated[int, Query(ge=1, description="Publication ID")],
    user_id: Annotated[int | None, Query(ge=1, description="User ID")] = None,
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Page size")] = 20,
    pivot_record_id: Annotated[
        UUID4 | None, Query(description="Return the page containing this record")
    ] = None,
    sort: Annotated[
        Literal["created_at", "updated_at"],
        Query(description="Sort field"),
    ] = "created_at",
) -> PaginatedResponse[RecordFull]:
    return await service.list_records(
        user_id=user_id or token.user_id,
        publ_id=publ_id,
        page=page,
        page_size=page_size,
        sort=sort,
        pivot_record_id=pivot_record_id,
    )


@router.get("/export", response_model=None)
async def export_records(
    service: Annotated[RecordService, Depends()],
    token: TokenUser,
    publ_id: Annotated[int, Query(ge=1, description="Publication ID")],
    user_id: Annotated[int | None, Query(description="User ID")] = None,
) -> StreamingResponse:
    content = await service.export_records(
        user_id=user_id or token.user_id,
        publ_id=publ_id,
    )

    return StreamingResponse(
        content=iter([content]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=records.xlsx"},
    )


@router.get("/export-all", response_model=None)
async def export_all_records(
    service: Annotated[RecordService, Depends()],
    token: TokenUser,
    user_id: Annotated[int | None, Query(description="User ID")] = None,
) -> StreamingResponse:
    content = await service.export_all_records(
        user_id=user_id or token.user_id,
    )

    return StreamingResponse(
        content=iter([content]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=records_all.xlsx"},
    )
