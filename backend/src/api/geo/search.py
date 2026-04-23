import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Request

from core.dependencies import LocationData
from core.rate_limiter import limiter
from schemas.geo import GeoSearchRequest, GeoSearchResponse
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
    try:
        suggestions = await geo.get_location_suggestions(
            location_data, data.field, data.text, data.filters
        )
        return GeoSearchResponse(suggestions=suggestions)
    except Exception as e:
        logger.error(f"Geo search failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error") from e
