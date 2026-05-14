from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response, StreamingResponse

from core.config import settings
from core.exceptions import AdminOnlyError
from schema.common import PaginatedResponse
from schema.records import RecordFull
from service.export import records_to_csv, records_to_excel
from service.records import RecordService

router = APIRouter(
    prefix="/records",
)


@router.get("")
async def list_records(
    service: Annotated[RecordService, Depends()],
    user_id: Annotated[int, Query(description="User ID")],
    publ_id: Annotated[int | None, Query(description="Publication ID")] = None,
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Page size")] = 20,
    sort: Annotated[
        Literal["created_at", "updated_at"],
        Query(description="Sort field"),
    ] = "created_at",
) -> PaginatedResponse[RecordFull]:
    result = await service.list_records(
        user_id=user_id,
        publ_id=publ_id,
        page=page,
        page_size=page_size,
        sort=sort,
    )

    return PaginatedResponse(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        pages=result["pages"],
    )


@router.get("/export", response_model=None)
async def export_records(
    service: Annotated[RecordService, Depends()],
    user_id: Annotated[int, Query(..., description="User ID")],
    publ_id: Annotated[
        int | None,
        Query(..., description="Publication ID if exporting records for publication"),
    ] = None,
    scope: Annotated[
        Literal["user", "project"],
        Query(description="Export scope: use 'project' for full dataset"),
    ] = "user",
    format: Annotated[str, Query(description="Export format: xlsx or csv")] = "xlsx",
) -> Response | StreamingResponse:
    # TODO: remove or impl
    if scope == "project":
        raise AdminOnlyError

    result = await service.list_records(
        user_id=user_id,
        publ_id=publ_id,
        page=1,
        page_size=settings.MAX_RECORDS_PER_PUBLICATION,
    )

    if format == "csv":
        content = records_to_csv(result["items"])
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=records.csv"},
        )

    content = records_to_excel(result["items"])

    return StreamingResponse(
        content=iter([content]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=records.xlsx"},
    )
