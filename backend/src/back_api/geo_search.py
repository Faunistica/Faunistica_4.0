import json
import logging
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from back_api.schemas import GeoSearchRequest, GeoSearchResponse
from back_api.token import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()
json_path = Path(__file__).resolve().parent.parent / "locations.json"
_LOCATION_DATA = None


def _load_location_data():
    global _LOCATION_DATA
    if _LOCATION_DATA is None:
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                _LOCATION_DATA = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load location data: {e}", exc_info=True)
            _LOCATION_DATA = []
    return _LOCATION_DATA


async def get_suggestions(
    field: str, text: str, filters: Optional[Dict] = None
) -> List[str]:
    location_data = _load_location_data()
    if not location_data:
        return []
    text = text.lower().strip()
    filters = filters or {}

    if field == "region":
        return [r["region"] for r in location_data if text in r["region"].lower()][:100]

    elif field == "district":
        region_filter = filters.get("region")
        districts = []

        for entry in location_data:
            if region_filter and entry["region"] != region_filter:
                continue

            districts.extend([d for d in entry["districts"] if text in d.lower()])

        return districts[:200]

    return []


@router.post("/geo_search", response_model=GeoSearchResponse)
async def geo_search(
    request: Request,
    data: GeoSearchRequest,
    user_data: dict = Depends(get_current_user),
):
    try:
        suggestions = await get_suggestions(data.field, data.text, data.filters)
        return {"suggestions": suggestions or None}
    except Exception as e:
        logger.error(f"Geo search failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
