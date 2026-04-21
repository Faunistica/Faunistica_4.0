import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from api.rate_limiter import limiter
from core.config import settings
from core.database import get_session
from core.security import create_access_token, create_refresh_token
from repository.user import find_user_by_username, is_pass_correct
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

    if not await is_pass_correct(session, user.id, data.password):
        logger.warning("Wrong password")
        raise HTTPException(status_code=401, detail="Wrong password")

    token_payload = TokenPayload(user_id=user.id, username=data.username)
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.REFRESH_TOKEN_EXPIRE_SECONDS,
        path="/",
    )

    return Message(message="ok")
