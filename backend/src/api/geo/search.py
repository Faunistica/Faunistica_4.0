import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Request

from core.dependencies import LocationData
from core.rate_limiter import limiter
from schema.geo import GeoSearchRequest, GeoSearchResponse
from service import geo

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/search")
@limiter.limit("10/second")
async def search_geo(
    request: Request,
    data: Annotated[GeoSearchRequest, Query()],
    location_data: LocationData,
) -> GeoSearchResponse:
    """
    Поиск географических локаций.

    Ищет подсказки локаций по полю и тексту с фильтрацией по региону.
    """
    suggestions = await geo.get_location_suggestions(
        location_data, data.field, data.text, data.filters
    )
    return GeoSearchResponse(suggestions=suggestions)
