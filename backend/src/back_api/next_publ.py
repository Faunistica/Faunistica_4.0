import logging
from typing import Annotated, cast

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from back_api.rate_limiter import limiter
from back_api.token import get_current_user
from database.crud import get_user, is_publ_filled, update_user
from database.database import get_session

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/next_publ")
@limiter.limit("10/minute")
async def next_publ(
    request: Request,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> bool:
    user_id = int(user_data["sub"])
    user_info = await get_user(session, user_id)

    if not await is_publ_filled(session, user_id, int, user_info.publ_id):
        logger.warning("Publication is not filled")
        raise HTTPException(status_code=409, detail="Publication is not filled")

    if len(user_info.items) == 0:
        logger.warning("No publications available for user %d", user_id)
        raise HTTPException(status_code=404, detail="No publications available")

    items = user_info.items.split("|")
    num_publ = (
        items.index(str(user_info.publ_id)) if str(user_info.publ_id) in items else -1
    )

    if (num_publ != -1) and (num_publ != len(items) - 1):
        publ_id = int(items[num_publ + 1])
        await update_user(session=session, user_id=user_id, publ_id=publ_id)
        return True
    return False
