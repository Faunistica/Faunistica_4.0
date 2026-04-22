import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from api.rate_limiter import limiter
from core.database import get_session
from core.security import set_response_token_cookies
from repository.user import find_user_by_username, is_password_correct
from schemas.common import LoginRequest, Message
from schemas.jwt import TokenPayload

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/login")
@limiter.limit("15/minute")
async def login(
    request: Request,
    response: Response,
    data: LoginRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Message:
    user = await find_user_by_username(session, data.username)
    if user is None:
        logger.warning("User not found for this username")
        raise HTTPException(status_code=404, detail="User not found for this username")

    if not await is_password_correct(session, user.id, data.password):
        logger.warning("Wrong password")
        raise HTTPException(status_code=401, detail="Wrong password")

    token_payload = TokenPayload(sub=user.id, username=data.username)
    set_response_token_cookies(response, token_payload)

    return Message(message="ok")
