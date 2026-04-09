import logging
from typing import Annotated

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import HTTP_404_NOT_FOUND

from back_api.rate_limiter import limiter
from back_api.schemas import Message, SupportRequest
from back_api.util import get_http_session
from database.database import get_session
from service.support import SupportService, get_support_service
from service.user import UserService, get_user_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/support")
@limiter.limit("1/minute")
async def support(
    request: Request,
    data: SupportRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    http_session: Annotated[aiohttp.ClientSession, Depends(get_http_session)],
    users: Annotated[UserService, Depends(get_user_service)],
    support_svc: Annotated[SupportService, Depends(get_support_service)],
) -> Message:
    try:
        user_id = await users.get_by_username(session, data.user_name)

        if user_id is None:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail=f"user not found. username: {data.user_name}",
            )

        await support_svc.send_support_message(http_session, data, user_id)
        return Message(message="Support request received")
    except Exception as e:
        logger.error(f"Failed to process support request: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"failed to process support request: {str(e)}"
        ) from e
