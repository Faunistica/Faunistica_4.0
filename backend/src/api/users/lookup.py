import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from core.exceptions import UserNotFoundError
from schema.user import UserLookupResponse
from service.user import UserService

router = APIRouter()

logger = logging.getLogger(__name__)


@router.get("/lookup")
async def lookup_user(
    username: Annotated[str, Query(..., description="Username to lookup")],
    user_service: Annotated[UserService, Depends()],
) -> UserLookupResponse:
    user = await user_service.find_by_username(username)
    if user is None:
        logger.info("User lookup failed: %s", username)
        raise UserNotFoundError(username)

    return UserLookupResponse(user_id=user.user_id, username=user.username)
