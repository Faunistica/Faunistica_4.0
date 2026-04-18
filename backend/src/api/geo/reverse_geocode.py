import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Request

from schemas import GetLocationRequest, GetLocationResponse
from service.geo import GeoService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/reverse-geocode")
async def reverse_geocode(
    request: Request,
    data: GetLocationRequest,
    geo: Annotated[GeoService, Depends()],
) -> GetLocationResponse:
    latitude = geo.dms_to_degrees(data.degrees_n, data.minutes_n, data.seconds_n)
    longitude = geo.dms_to_degrees(data.degrees_e, data.minutes_e, data.seconds_e)
    location = geo.get_location_names(latitude, longitude)
    return GetLocationResponse(
        country=location.country,
        region=location.region,
        district=location.district,
    )
