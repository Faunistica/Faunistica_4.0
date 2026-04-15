import logging
from typing import Annotated

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import HTTP_404_NOT_FOUND

from api.rate_limiter import limiter
from api.schemas import Message, SupportRequest
from api.util import get_http_session
from database.database import get_session
from service.support import SupportService
from service.user import UserService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/support", tags=["support"])


@router.post("")
@limiter.limit("1/minute")
async def submit_support(  # noqa: PLR0913
    request: Request,
    data: SupportRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    http_session: Annotated[aiohttp.ClientSession, Depends(get_http_session)],
    users: Annotated[UserService, Depends()],
    support: Annotated[SupportService, Depends()],
) -> Message:
    try:
        user_id = await users.get_by_username(session, data.user_name)

        if user_id is None:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail=f"user not found. username: {data.user_name}",
            )

        await support.send_message(http_session, data, user_id)
        return Message(message="Support request received")
    except Exception as e:
        logger.error(f"Failed to process support request: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"failed to process support request: {str(e)}"
        ) from e
