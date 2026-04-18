from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.rate_limiter import limiter
from api.schemas import StatisticsResponse
from core.database import get_session
from repository import record as record_repo

router = APIRouter()


@router.get("/general")
@limiter.limit("60/minute")
async def get_general_stats(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> StatisticsResponse:
    return await record_repo.get_statistics(session)
