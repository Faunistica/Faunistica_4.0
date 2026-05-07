from typing import Annotated

from fastapi import APIRouter, Depends, Query

from core.dependencies import TokenUser
from schema.common import Publication
from service.publications import PublicationService

router = APIRouter(prefix="/publications")


@router.get("/current")
async def list_publications(
    pub_service: Annotated[PublicationService, Depends()],
    token: TokenUser,
    list_all: Annotated[
        bool, Query(description="Return all assigned publications")
    ] = False,
) -> list[Publication]:
    return await pub_service.get_current(token, list_all)
