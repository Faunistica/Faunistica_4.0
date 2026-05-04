import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from core.dependencies import DBSession
from core.rate_limiter import limiter
from core.security import get_jwt_user
from schema.common import Message
from service.actions import ActionService

logger = logging.getLogger(__name__)

router = APIRouter()


# FIXME: token blacklist
@router.post("/logout")
@limiter.limit("1/minute")
async def logout(
    request: Request,
    response: Response,
    action_service: Annotated[ActionService, Depends()],
) -> Message:
    """
    Выход пользователя.

    Очищает куки JWT токенов доступа и обновления, логирует fau_logout.
    """
    try:
        user = get_jwt_user(request)
    except HTTPException:
        logger.warning("Logout with invalid/missing token")
    except Exception as e:
        logger.warning("Failed to get user from token: %s", e)
    else:
        try:
            await action_service.log_logout(user.user_id, None)
        except Exception as e:
            logger.warning("Failed to log logout action: %s", e)

    response.delete_cookie(key="access_token", path="/api")
    response.delete_cookie(key="refresh_token", path="/api")

    return Message(message="Successfully logged out")
