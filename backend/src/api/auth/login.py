import logging
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from core.dependencies import ClientIP, DBSession
from core.rate_limiter import limiter
from core.security import check_password, set_response_token_cookies
from repository.user import UserUpdate, find_user_by_username, update_user, increment_token_version
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
    Аутентификация пользователя по логину и паролю.

    При успешной проверке устанавливает JWT токены в HTTP-only cookies
    """
    user = await find_user_by_username(session, data.username)
    if user is None:
        logger.warning("User not found: %s", data.username)
        raise HTTPException(status_code=404, detail="User not found")

    if user.hash is None:
        logger.warning("User has no password hash: %s", data.username)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    result = check_password(data.password, user.hash)
    if not result.is_valid:
        logger.warning("Wrong password for user: %s", data.username)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if result.new_hash:
        await update_user(session, user.user_id, UserUpdate(hash=result.new_hash))
        await increment_token_version(session, user.user_id)

    if user.hash_date is not None:
        now = datetime.now()
        minutes_since_hash = (now - user.hash_date).total_seconds() / 60
        if minutes_since_hash > 3000:
            logger.warning("Password expired for user: %s", data.username)
            raise HTTPException(status_code=401, detail="Password expired")

    token_payload = TokenPayload(
        sub=str(user.user_id), username=data.username, version=user.token_version
    )
    set_response_token_cookies(response, token_payload)

    await action_service.log_login(user.user_id, ip)

    return UserLoginResponse(
        user_id=user.user_id,
        username=data.username,
    )
