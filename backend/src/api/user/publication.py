import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.rate_limiter import limiter
from core.database import get_session
from core.security import get_request_user
from repository.publication import user_filled_publication
from repository.user import get_user, get_username_and_publications, update_user
from schemas.common import Publication
from schemas.jwt import TokenPayload

logger = logging.getLogger(__name__)
router = APIRouter()
base_url = "https://faunistica.ru/files/"


@router.get("/publication")
@limiter.limit("666/minute")
async def get_publication(
    request: Request,
    token: Annotated[TokenPayload, Depends(get_request_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Publication:
    try:
        data = await get_username_and_publications(session, token.user_id)

        return Publication(
            author=data["publication"]["author"],
            year=data["publication"]["year"],
            name=data["publication"]["name"],
            pdf_file=base_url + data["publication"]["pdf_file"],
        )
    except Exception as e:
        logger.error(f"HTTP Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Server database error: {str(e)}"
        ) from e


@router.get("/publication/next")
@limiter.limit("10/minute")
async def get_next_publication(
    request: Request,
    token: Annotated[TokenPayload, Depends(get_request_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> bool:
    user_id = token.user_id
    user = await get_user(session, user_id)

    if user.publ_id is not None and not await user_filled_publication(
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
        await update_user(session, user_id, publ_id=publ_id)
        return True
    return False
