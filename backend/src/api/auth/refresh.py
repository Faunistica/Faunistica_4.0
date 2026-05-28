import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response

from core.exceptions import InvalidTokenError
from core.security import set_response_token_cookies, verify_token
from schema.common import Message
from schema.jwt import TokenPayload
from service.user import UserService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    user_service: Annotated[UserService, Depends()],
) -> Message:
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        logger.warning("Refresh token missing")
        raise InvalidTokenError("Refresh token missing")

    payload = verify_token(refresh_token)

    if payload.type != "refresh":
        logger.warning("Invalid refresh token type")
        raise InvalidTokenError

    user = await user_service.get(int(payload.sub))
    if user is None or user.token_version != payload.version:
        logger.warning("Invalid refresh token")
        raise InvalidTokenError

    token_payload = TokenPayload(
        sub=str(payload.sub), username=payload.username, version=user.token_version
    )
    set_response_token_cookies(response, token_payload)

    return Message(message="Access token refreshed")
