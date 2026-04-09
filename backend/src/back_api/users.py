import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from back_api.rate_limiter import limiter
from back_api.schemas import Message, UserRequest
from config.config import ACCESS_TOKEN_EXPIRE, REFRESH_TOKEN_EXPIRE
from database.database import get_session
from service.token import TokenService, get_token_service
from service.user import UserService, get_user_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/get_user")
@limiter.limit("15/minute")
async def handle_user_data(
    request: Request,
    response: Response,
    data: UserRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    tokens: Annotated[TokenService, Depends(get_token_service)],
    users: Annotated[UserService, Depends(get_user_service)],
) -> Message:
    user_id = await users.get_by_username(session, data.username)
    if user_id is None:
        logger.warning("User not found for this username")
        raise HTTPException(status_code=404, detail="User not found for this username")

    if not await users.verify_password(session, user_id, data.password):
        logger.warning("Wrong password")
        raise HTTPException(status_code=401, detail="Wrong password")

    token_payload = {"sub": str(user_id), "username": data.username}
    access_token = tokens.create_access_token(token_payload)
    refresh_token = tokens.create_refresh_token(token_payload)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=ACCESS_TOKEN_EXPIRE * 60,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=REFRESH_TOKEN_EXPIRE * 60,
        path="/",
    )

    return Message(message="ok")
