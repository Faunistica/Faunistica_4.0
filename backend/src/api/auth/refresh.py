import logging

from fastapi import APIRouter, Request, Response

from core.dependencies import DBSession
from core.exceptions import InvalidTokenError
from core.security import set_response_token_cookies, verify_token
from repository.user import get_user
from schema.common import Message
from schema.jwt import TokenPayload

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    session: DBSession,
) -> Message:
    """
    Обновление токена доступа.

    Проверяет refresh токен из куки и выдает новый токен доступа.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        logger.warning("Refresh token missing")
        raise InvalidTokenError("Refresh token missing")

    payload = verify_token(refresh_token)

    if payload.type != "refresh":
        logger.warning("Invalid refresh token type")
        raise InvalidTokenError("Invalid token")

    user = await get_user(session, int(payload.sub))
    if user is None or user.token_version != payload.version:
        logger.warning("Invalid refresh token")
        raise InvalidTokenError("Invalid token")

    token_payload = TokenPayload(
        sub=str(payload.sub), username=payload.username, version=user.token_version
    )
    set_response_token_cookies(response, token_payload)

    return Message(message="Access token refreshed")
