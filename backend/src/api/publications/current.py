from typing import Annotated

from fastapi import APIRouter, Depends, Query

from core.dependencies import TokenUser
from core.security import get_jwt_user
from schema.common import Publication
from service.publications import PublicationService

router = APIRouter(prefix="/publications")


@router.get("/{publ_id}", dependencies=[Depends(get_jwt_user)])
async def get(
    publ_id: int,
    pub_service: Annotated[PublicationService, Depends()],
) -> Publication | None:
    return await pub_service.get(publ_id)


@router.get("/current")
async def list_publications(
    pub_service: Annotated[PublicationService, Depends()],
    token: TokenUser,
    list_all: Annotated[
        bool, Query(description="Return all assigned publications")
    ] = False,
) -> list[Publication]:
    return await pub_service.get_current(user_id=token.user_id, with_queue=list_all)
