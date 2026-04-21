from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from core.security import get_request_user
from repository.user import get_personal_stats, get_user, get_user_stats
from schemas.jwt import TokenPayload

router = APIRouter()


@router.get("/me")
async def personal_stats(
    request: Request,
    token: Annotated[TokenPayload, Depends(get_request_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> tuple[str, int, dict, list[dict]]:
    user_id = token.user_id
    user_info = await get_user(session, user_id)
    username = user_info.name
    stats = await get_user_stats(session, user_id)
    table_stats = await get_personal_stats(session, user_id)
    return username, user_id, stats, table_stats
