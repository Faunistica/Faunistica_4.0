import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from core.dependencies import DBSession, TokenUser
from core.exceptions import UserNotFoundError
from repository.publication import (
    get_publications_by_ids,
    get_user_publication,
)
from repository.user import get_user
from schema.common import Publication
from service.publications import pipe_to_array

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/publications")


@router.get("/current")
async def list_publications(
    session: DBSession,
    token: TokenUser,
    list: Annotated[
        bool, Query(description="Return all assigned publications")
    ] = False,
) -> list[Publication]:
    user_id = token.user_id

    if user_id != token.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    if not list:
        publ = await get_user_publication(session, token.user_id)
        if not publ:
            return []

        return [Publication.model_validate(publ)]

    user = await get_user(session, user_id)
    if user is None:
        logger.error(
            "Token exists for user, but not found in database: id - %d", user_id
        )
        raise UserNotFoundError(id=user_id)
    if not user.items:
        return []

    try:
        publ_ids = pipe_to_array(user.items) if user.items else None
    except ValueError as exc:
        logger.error(
            "Invalid item format in database: user %d, items %s",
            user.user_id,
            user.items,
            exc_info=exc,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        ) from exc

    if not publ_ids:
        return []

    publications = await get_publications_by_ids(session, publ_ids)
    return [Publication.model_validate(p) for p in publications]
