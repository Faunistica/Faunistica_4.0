import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from core.dependencies import DBSession, TokenUser
from core.rate_limiter import limiter
from core.security import validate_user_id_path
from repository.publication import user_filled_publication
from repository.user import get_current_publication, get_user, update_user
from schemas.common import Publication
from schemas.user import UpdateUser

PUBLICATION_BASE_URL = "https://faunistica.ru/files/"

logger = logging.getLogger(__name__)

# TODO: improve user_id type in generated api docs
router = APIRouter(dependencies=[Depends(validate_user_id_path)], tags=["publications"])


@router.get("/publication")
@limiter.limit("1/second")
async def get_publication(
    request: Request,
    token: TokenUser,
    session: DBSession,
) -> Publication:
    """
    Получение назначенной пользователю публикации.

    Возвращает публикацию с автором, годом, названием и URL PDF-файла.
    """
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
    token: TokenUser,
    session: DBSession,
) -> bool:
    """
    Переход к следующей доступной публикации.

    Переводит пользователя к следующей публикации в его списке.
    """
    user_id = token.user_id
    user = await get_user(session, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if user.publ_id is not None and not await user_filled_publication(
        session, user_id, user.publ_id
    ):
        logger.warning("Publication is not filled")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Publication is not filled"
        )

    if user.publ_id is None or user.items is None or len(user.items) == 0:
        logger.warning("No publications available for user %d", user_id)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="No publications available"
        )

    items = user.items.split("|")
    num_publ = items.index(str(user.publ_id)) if str(user.publ_id) in items else -1

    if (num_publ != -1) and (num_publ != len(items) - 1):
        publ_id = int(items[num_publ + 1])
        await update_user(session, user_id, UpdateUser(publ_id=publ_id))
        return True
    return False
