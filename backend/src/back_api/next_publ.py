import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from back_api.rate_limiter import limiter
from database.database import get_session
from service.publication import PublicationService, get_publication_service
from service.token import get_current_user
from service.user import UserService, get_user_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/next_publ")
@limiter.limit("10/minute")
async def next_publ(
    request: Request,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    users: Annotated[UserService, Depends(get_user_service)],
    pubs: Annotated[PublicationService, Depends(get_publication_service)],
) -> bool:
    user_id = int(user_data["sub"])
    user = await users.get_by_id(session, user_id)

    # NOTE: gessing how it should work, shoud check if incorrect
    if user.publ_id is not None and not await pubs.is_filled(
        session, user_id, user.publ_id
    ):
        logger.warning("Publication is not filled")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Publication is not filled"
        )

    if user.items is None or len(user.items) == 0:
        logger.warning("No publications available for user %d", user_id)
        raise HTTPException(status_code=404, detail="No publications available")

    items = user.items.split("|")
    num_publ = items.index(str(user.publ_id)) if str(user.publ_id) in items else -1

    if (num_publ != -1) and (num_publ != len(items) - 1):
        publ_id = int(items[num_publ + 1])
        await users.update(session, user_id, publ_id=publ_id)
        return True
    return False
