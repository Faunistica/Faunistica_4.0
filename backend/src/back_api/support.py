import logging
from typing import Annotated

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from back_api.messages import send_support_message
from back_api.rate_limiter import limiter
from back_api.schemas import SupportRequest
from back_api.util import get_http_session
from database.crud import get_user_id_by_username
from database.database import get_session

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/support")
@limiter.limit("1/minute")
async def support(
    request: Request,
    data: SupportRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    http_session: Annotated[aiohttp.ClientSession, Depends(get_http_session)],
):
    try:
        user_id = await get_user_id_by_username(session, data.user_name)
        await send_support_message(http_session, data, user_id)
        return {"message": "Support request received"}
    except Exception as e:
        logger.error(f"Failed to process support request: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to process support request: {str(e)}"
        ) from e
