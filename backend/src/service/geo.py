import logging

from fastapi import HTTPException
from geopy.exc import GeocoderTimedOut
from geopy.geocoders import Nominatim

from schema.geo import GeoFilters, RegionData, ReverseGeoCodeLocation

logger = logging.getLogger(__name__)


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
        logger.error(f"GeocoderTimedOut: {e}", exc_info=True)
        raise HTTPException(status_code=408, detail="Geocoding service timeout") from e
    except Exception as e:
        logger.error(f"HTTP Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) from e


def dms_to_degrees(
    degrees: float,
    minutes: float | None = None,
    seconds: float | None = None,
) -> float:
    minutes = minutes if minutes is not None else 0
    seconds = seconds if seconds is not None else 0
    return degrees + (minutes / 60) + (seconds / 3600)
