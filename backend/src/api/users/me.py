from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user
from core.database import get_session
from repository import user as user_repo

router = APIRouter()


@router.get("/me")
async def personal_stats(
    request: Request,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> tuple[str, int, dict, list[dict]]:
    user_id = int(user_data["sub"])
    user_info = await user_repo.get_user(session, user_id)
    username = user_info.name
    stats = await user_repo.get_user_stats(session, user_id)
    table_stats = await user_repo.get_personal_stats(session, user_id)
    return username, user_id, stats, table_stats
