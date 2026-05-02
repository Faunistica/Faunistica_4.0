import logging
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from core.dependencies import ClientIP, DBSession
from core.exceptions import ActionLoggingError
from core.rate_limiter import limiter
from core.security import check_md5_password, set_response_token_cookies
from repository.user import find_user_by_username
from schema.common import LoginRequest, UserLoginResponse
from schema.jwt import TokenPayload
from service.actions import ActionService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/login")
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
    data: LoginRequest,
    session: DBSession,
    ip: ClientIP,
    action_service: Annotated[ActionService, Depends()],
) -> UserLoginResponse:
    """
    Аутентификация пользователя по логину и паролю (MD5).

    Валидирует MD5 пароль из Telegram бота, проверяет hash_date <= 3000 минут,
    устанавливает JWT токены в HTTP-only куках, логирует fau_login.
    """
    user = await find_user_by_username(session, data.username)
    if user is None:
        logger.warning("User not found: %s", data.username)
        raise HTTPException(status_code=404, detail="User not found")

    if user.hash is None:
        logger.warning("User has no password hash: %s", data.username)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not check_md5_password(data.password, user.hash):
        logger.warning("Wrong password for user: %s", data.username)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.hash_date is not None:
        now = datetime.now()
        minutes_since_hash = (now - user.hash_date).total_seconds() / 60
        if minutes_since_hash > 3000:
            logger.warning("Password expired for user: %s", data.username)
            raise HTTPException(status_code=401, detail="Password expired")

    token_payload = TokenPayload(sub=str(user.user_id), username=data.username)
    set_response_token_cookies(response, token_payload)

    try:
        await action_service.log_login(user.user_id, ip)
    except ActionLoggingError as e:
        logger.error("Failed to log login action: %s", e)
        raise HTTPException(status_code=500, detail="Failed to log action") from e

    return UserLoginResponse(
        user_id=user.user_id,
        username=data.username,
    )
