from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from core.dependencies import DBSession
from repository.stats import get_user_by_id, get_user_by_name, get_user_statistics
from schema.statistics import UserStatisticsResponse

router = APIRouter()


@router.get("/users")
async def read_user_statistics(
    session: DBSession,
    user_id: Annotated[int | None, Query()] = None,
    name: Annotated[str | None, Query()] = None,
) -> UserStatisticsResponse:
    if user_id is not None:
        user = await get_user_by_id(session, user_id)
    elif name is not None:
        user = await get_user_by_name(session, name)
    else:
        raise HTTPException(status_code=400, detail="Provide user_id or name")

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    stats = await get_user_statistics(session, user.user_id)
    return UserStatisticsResponse(user_id=user.user_id, name=user.name, **stats)
