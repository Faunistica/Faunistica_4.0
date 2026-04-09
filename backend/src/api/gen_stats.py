from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.rate_limiter import limiter
from api.schemas import StatisticsResponse
from database.database import get_session
from service.record import RecordService

router = APIRouter()


@router.get("/get_gen_stats")
@limiter.limit("60/minute")
async def get_gen_stats(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
    records: Annotated[RecordService, Depends()],
) -> StatisticsResponse:
    return await records.get_stats(session)
