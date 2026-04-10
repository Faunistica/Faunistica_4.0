from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database.database import get_session
from service.token import get_current_user
from service.user import UserService

router = APIRouter()


@router.get("/me")
async def personal_stats(
    request: Request,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    users: Annotated[UserService, Depends()],
) -> tuple[str, int, dict, list[dict]]:
    user_id = int(user_data["sub"])
    user_info = await users.get_by_id(session, user_id)
    username = user_info.name
    stats = await users.get_stats(session, user_id)
    table_stats = await users.get_personal(session, user_id)
    return username, user_id, stats, table_stats
