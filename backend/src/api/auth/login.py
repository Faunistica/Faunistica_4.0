import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from core.dependencies import ClientIP, DBSession
from core.rate_limiter import limiter
from core.security import check_password, set_response_token_cookies
from schema.common import LoginRequest, UserLoginResponse
from schema.jwt import TokenPayload
from service.actions import ActionService
from service.user import REGISTERED_STATES, UserService

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
    user = await UserService(session).find_by_username(data.username)
    if user is None:
        logger.info("User not found: %s", data.username)
        raise HTTPException(status_code=404, detail="User not found")

    if user.name is None or user.reg_stat not in REGISTERED_STATES:
        logger.info("User not fully registered: %s", data.username)
        raise HTTPException(status_code=403, detail="Registration not completed")

    if user.hash is None:
        logger.info("User has no password hash: %s", data.username)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    result = check_password(data.password, user.hash)
    if not result.is_valid:
        logger.info("Wrong password for user: %s", data.username)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if result.new_hash:
        await UserService(session).update_user_data(user.user_id, hash=result.new_hash)

    if UserService.is_password_expired(user):
        logger.info("Password expired for user: %s", data.username)
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
