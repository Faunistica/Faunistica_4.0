import logging

from fastapi import APIRouter, HTTPException, Request, status

from api.dependencies import DBSession, Token
from api.rate_limiter import limiter
from repository.publication import user_filled_publication
from repository.user import get_current_publication, get_user, update_user
from schemas.common import Publication

PUBLICATION_BASE_URL = "https://faunistica.ru/files/"

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/publication")
@limiter.limit("666/minute")
async def get_publication(
    request: Request,
    token: Token,
    session: DBSession,
) -> Publication:
    data = await get_current_publication(session, token.user_id)

    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No publication is assigned to user",
        )

    return Publication(
        author=data.author,
        year=str(data.year) if data.year is not None else None,
        name=data.name,
        pdf_file=PUBLICATION_BASE_URL + data.pdf_file
        if data.pdf_file is not None
        else None,
    )


@router.get("/publication/next")
@limiter.limit("10/minute")
async def get_next_publication(
    request: Request,
    token: Token,
    session: DBSession,
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
