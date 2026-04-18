import logging
from typing import Annotated, Literal

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import HTTP_404_NOT_FOUND

from api.rate_limiter import limiter
from api.util import get_http_session
from core.database import get_session
from repository.user import find_user_by_username
from schemas import Message, SupportRequest
from service import support

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/support", tags=["support"])


@router.post("")
@limiter.limit("1/minute")
async def submit_support(  # noqa: PLR0913
    request: Request,
    data: SupportRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    http_session: Annotated[aiohttp.ClientSession, Depends(get_http_session)],
) -> Message[Literal["ok"]]:
    try:
        user = await find_user_by_username(session, data.user_name)

        if user is None:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail=f"user not found. username: {data.user_name}",
            )

        await support.send_message(http_session, data, user.id)
        return Message(message="ok")
    except Exception as e:
        logger.error(f"Failed to process support request: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"failed to process support request: {str(e)}"
        ) from e
