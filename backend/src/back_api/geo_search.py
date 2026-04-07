import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request

from back_api.schemas import GeoSearchRequest, GeoSearchResponse

logger = logging.getLogger(__name__)
router = APIRouter()


def get_location_data(request: Request) -> list[dict[str, Any]]:
    return request.app.state.location_data


async def get_suggestions(
    location_data: list[dict[str, Any]],
    field: str,
    text: str,
    filters: dict | None = None,
) -> list[str]:
    if not location_data:
        return []

    text = text.lower().strip()
    filters = filters or {}

    if field == "region":
        return [r["region"] for r in location_data if text in r["region"].lower()][:100]

    if field == "district":
        region_filter = filters.get("region")
        districts = []

        for entry in location_data:
            if region_filter and entry["region"] != region_filter:
                continue

            districts.extend([d for d in entry["districts"] if text in d.lower()])

        return districts[:200]

    return []


@router.post("/geo_search")
async def geo_search(
    request: Request,
    data: GeoSearchRequest,
    location_data: Annotated[list[dict[str, Any]], Depends(get_location_data)],
) -> GeoSearchResponse:
    try:
        suggestions = await get_suggestions(
            location_data, data.field, data.text, data.filters
        )
        return GeoSearchResponse(suggestions=suggestions)
    except Exception as e:
        logger.error(f"Geo search failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error") from e
