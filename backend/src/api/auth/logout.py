import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from core.dependencies import DBSession
from core.rate_limiter import limiter
from core.security import get_jwt_user
from repository.user import increment_token_version
from schema.common import Message
from service.actions import ActionService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/logout")
@limiter.limit("1/minute")
async def logout(
    request: Request,
    response: Response,
    session: DBSession,
    action_service: Annotated[ActionService, Depends()],
) -> Message:
    """
    Выход пользователя.

    Инвалидирует токены (инкрементит token_version),
    очищает куки, логирует fau_logout.
    """
    try:
        user = await get_jwt_user(request, session)
        await increment_token_version(session, user.user_id)
        await action_service.log_logout(user.user_id, None)
    except HTTPException:
        logger.warning("Logout with invalid/missing token")
    except Exception as e:
        logger.warning("Failed to get user from token: %s", e)

    response.delete_cookie(key="access_token", path="/api")
    response.delete_cookie(key="refresh_token", path="/api")

    return Message(message="Successfully logged out")
