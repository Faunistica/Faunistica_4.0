from __future__ import annotations

import json
import logging

from fastapi import HTTPException
from geopy.exc import GeocoderTimedOut, GeopyError
from geopy.geocoders import Nominatim

from core.config import settings
from schema.geo import GeoFilters, RegionData, ReverseGeoCodeLocation

logger = logging.getLogger(__name__)


# TODO: remove async or improve perf
async def get_location_suggestions(
    location_data: list[RegionData],
    field: str,
    text: str,
    filters: GeoFilters | None = None,
) -> list[str]:
    if not location_data:
        return []

    text = text.lower().strip()
    region_filter = filters.region if filters else None

    if field == "region":
        return [r.region for r in location_data if text in r.region.lower()][:100]

    if field == "district":
        districts = []

        for entry in location_data:
            if region_filter and entry.region != region_filter:
                continue

            districts.extend([d for d in entry.districts if text in d.lower()])

        return districts[:200]

    return []


# TODO: this uses sync IO, propably should use smth else
def get_location_names(lat: float, lon: float) -> ReverseGeoCodeLocation:
    geolocator = Nominatim(user_agent="geoapi", timeout=10)

    try:
        location = geolocator.reverse((lat, lon), language="ru")

        if location is None:
            logger.warning("Location not found for the given coordinates")
            raise HTTPException(
                status_code=404,
                detail="Location not found for the given coordinates",
            )

        address = location.raw.get("address", {})

        country = address.get("country", None)
        region = address.get("state", address.get("region", None))
        district = address.get("county", address.get("district", None))

        return ReverseGeoCodeLocation(country=country, region=region, district=district)
    except GeocoderTimedOut as e:
        logger.error("GeocoderTimedOut: %s", e, exc_info=True)
        raise HTTPException(status_code=408, detail="Geocoding service timeout") from e
    except GeopyError as e:
        logger.error("Geocoding error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) from e


def dms_to_degrees(
    degrees: float,
    minutes: float | None = None,
    seconds: float | None = None,
) -> float:
    minutes = minutes if minutes is not None else 0
    seconds = seconds if seconds is not None else 0
    return degrees + (minutes / 60) + (seconds / 3600)


class UralBorder:
    """Lazy-loaded Ural border polygon for point-in-polygon containment check."""

    _polygon: list[list[float]] | None = None

    @classmethod
    def _load(cls) -> list[list[float]]:
        path = settings.URAL_BORDER_PATH
        with open(path) as f:
            data = json.load(f)
        coords = data["features"][0]["geometry"]["coordinates"][0]
        return [[float(c[0]), float(c[1])] for c in coords]

    @classmethod
    def contains(cls, lon: float, lat: float) -> bool:
        """Test if point (lon, lat) is inside the Ural border polygon.

        Uses ray casting algorithm on GeoJSON polygon (lon/lat order).
        """

        # check the bounding recrangle first
        if lat < 48 or lat > 75 or lon < 51 or lon > 75:
            return False

        if cls._polygon is None:
            cls._polygon = cls._load()

        poly = cls._polygon
        n = len(poly)
        inside = False
        j = n - 1
        for i in range(n):
            lon_i, lat_i = poly[i]
            lon_j, lat_j = poly[j]
            if ((lat_i > lat) != (lat_j > lat)) and (
                lon < (lon_j - lon_i) * (lat - lat_i) / (lat_j - lat_i) + lon_i
            ):
                inside = not inside
            j = i
        return inside
