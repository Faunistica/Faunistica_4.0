import logging
from typing import Annotated

from fastapi import APIRouter, Query

from core.dependencies import DBSession
from core.exceptions import UserNotFoundError
from schema.user import UserLookupResponse
from service.user import UserService

router = APIRouter()

logger = logging.getLogger(__name__)


@router.get("/lookup")
async def lookup_user(
    name: Annotated[str, Query(..., description="Username to lookup")],
    session: DBSession,
) -> UserLookupResponse:
    user = await UserService(session).find_by_username(name)
    if user is None:
        logger.info("User lookup failed: %s", name)
        raise UserNotFoundError(name)

    return UserLookupResponse(user_id=user.user_id, name=user.name)
