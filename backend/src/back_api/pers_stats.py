from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from back_api.token import get_current_user
from database.crud import get_personal_stats, get_user, get_user_stats
from database.database import get_session

router = APIRouter()


@router.get("/get_pers_stats")
async def get_pers_stats(
    request: Request,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> tuple[str, int, dict, list[dict]]:
    user_id = int(user_data["sub"])
    user_info = await get_user(session, user_id)
    username = user_info.name
    stats = await get_user_stats(session, user_id)
    table_stats = await get_personal_stats(session, user_id)
    # FIXME: this is definitely non-ideal
    return username, user_id, stats, table_stats
