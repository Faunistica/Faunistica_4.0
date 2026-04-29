import logging
from typing import Annotated

from fastapi import APIRouter, Query

from core.dependencies import DBSession, TokenUser
from core.exceptions import UserNotFoundError
from repository import user as repo
from schema.user import UserLookupResponse

router = APIRouter()

logger = logging.getLogger(__name__)


@router.get("/lookup")
async def lookup_user(
    name: Annotated[str, Query(..., description="Username to lookup")],
    session: DBSession,
    token: TokenUser,
) -> UserLookupResponse:
    user = await repo.find_user_by_username(session, name)
    if user is None:
        logger.info("User lookup failed: %s", name)
        raise UserNotFoundError(name)

    return UserLookupResponse(user_id=user.user_id, name=user.name)
