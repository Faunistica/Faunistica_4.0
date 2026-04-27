from fastapi import APIRouter, HTTPException, Query, status

from core.dependencies import DBSession, TokenUser
from repository.publication import (
    get_publication,
    get_publications_by_ids,
    get_user_by_id,
)
from schemas.common import Publication

router = APIRouter(prefix="/publications", tags=["publications"])


@router.get("")
async def list_publications(  # noqa: PLR0913,FAST002
    session: DBSession,
    token: TokenUser,
    user_id: int = Query(..., description="User ID"),
    current: bool | None = Query(None, description="Return only current publication"),
) -> list[Publication]:
    if user_id != token.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    if current is True:
        user = await get_user_by_id(session, user_id)
        if not user or not user.publ_id:
            return []

        publ = await get_publication(session, user.publ_id)
        if not publ:
            return []
        return [Publication.model_validate(publ)]

    user = await get_user_by_id(session, user_id)
    if not user or not user.items:
        return []

    try:
        publ_ids = [int(x) for x in user.items.split("|") if x.strip()]
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user items format",
        ) from exc

    if not publ_ids:
        return []

    publications = await get_publications_by_ids(session, publ_ids)
    return [Publication.model_validate(p) for p in publications]
