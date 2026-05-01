from typing import Annotated

from fastapi import APIRouter, Query

from core.dependencies import PublicationServiceDep, TokenUser
from schema.common import Publication

router = APIRouter(prefix="/publications")


@router.get("/current")
async def list_publications(
    pub_service: PublicationServiceDep,
    token: TokenUser,
    list_all: Annotated[
        bool, Query(description="Return all assigned publications")
    ] = False,
) -> list[Publication]:
    return await pub_service.get_current(token, list_all)
