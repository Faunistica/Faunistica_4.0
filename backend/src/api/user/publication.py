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
