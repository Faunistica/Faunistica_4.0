import logging

from fastapi import APIRouter, HTTPException, Request, Response

from core.security import set_response_token_cookies, verify_token
from schema.common import Message
from schema.jwt import TokenPayload

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/refresh")
def refresh(
    request: Request,
    response: Response,
) -> Message:
    """
    Обновление токена доступа.

    Проверяет refresh токен из куки и выдает новый токен доступа.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        logger.warning("Refresh token missing")
        raise HTTPException(status_code=403, detail="Refresh token missing")

    payload = verify_token(refresh_token)

    if payload.type != "refresh":
        logger.warning("Invalid refresh token")
        raise HTTPException(status_code=403, detail="Invalid refresh token")

    token_payload = TokenPayload(sub=str(payload.sub), username=payload.username)
    set_response_token_cookies(response, token_payload)

    return Message(message="Access token refreshed")
