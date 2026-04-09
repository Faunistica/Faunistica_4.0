import logging

from fastapi import APIRouter, HTTPException, Request
from geopy.exc import GeocoderTimedOut
from geopy.geocoders import Nominatim

from back_api.schemas import GetLocationRequest, GetLocationResponse
from model import Location

logger = logging.getLogger(__name__)
router = APIRouter()


# FIXME: typing
def get_location_names(lat: float, lon: float) -> Location:
    geolocator = Nominatim(user_agent="geoapi", timeout=10)

    try:
        location = geolocator.reverse((lat, lon), language="ru")

        if location is None:
            logger.warning("Location not found for the given coordinates")
            raise HTTPException(
                status_code=404, detail="Location not found for the given coordinates"
            )

        address = location.raw.get("address", {})

        country = address.get("country", None)
        region = address.get("state", address.get("region", None))
        district = address.get("county", address.get("district", None))

        return Location(country=country, region=region, district=district)
    except GeocoderTimedOut as e:
        logger.error(f"GeocoderTimedOut: {e}", exc_info=True)
        raise HTTPException(status_code=408, detail="Geocoding service timeout") from e
    except Exception as e:
        logger.error(f"HTTP Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) from e


def dms_to_dd(
    degrees: float,
    minutes: float | None = None,
    seconds: float | None = None,
) -> float:
    minutes = minutes if minutes is not None else 0
    seconds = seconds if seconds is not None else 0
    return degrees + (minutes / 60) + (seconds / 3600)


@router.post("/get_loc")
async def get_loc(
    request: Request,
    data: GetLocationRequest,
) -> GetLocationResponse:
    latitude = dms_to_dd(data.degrees_n, data.minutes_n, data.seconds_n)
    longitude = dms_to_dd(data.degrees_e, data.minutes_e, data.seconds_e)
    location = get_location_names(latitude, longitude)
    return GetLocationResponse(
        country=location.get("country"),
        region=location.get("region"),
        district=location.get("district"),
    )
