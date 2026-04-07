from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from back_api.rate_limiter import limiter
from back_api.schemas import StatisticsResponse
from database.crud import get_statistics
from database.database import get_session

router = APIRouter()


@router.get("/get_gen_stats", response_model=StatisticsResponse)
@limiter.limit("60/minute")
async def get_gen_stats(
    request: Request, session: Annotated[AsyncSession, Depends(get_session)]
) -> dict:
    return await get_statistics(session)
