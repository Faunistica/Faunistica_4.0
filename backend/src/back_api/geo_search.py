import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request

from back_api import util
from back_api.schemas import GeoSearchRequest, GeoSearchResponse
from service import geo

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/geo_search")
async def geo_search(
    request: Request,
    data: GeoSearchRequest,
    location_data: Annotated[list[dict[str, Any]], Depends(util.get_location_data)],
) -> GeoSearchResponse:
    try:
        suggestions = await geo.get_suggestions(
            location_data, data.field, data.text, data.filters
        )
        return GeoSearchResponse(suggestions=suggestions)
    except Exception as e:
        logger.error(f"Geo search failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error") from e
