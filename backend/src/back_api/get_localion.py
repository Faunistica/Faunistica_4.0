import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Request

from back_api.schemas import GetLocationRequest, GetLocationResponse
from service.geo import GeoService, get_geo_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/get_loc")
async def get_loc(
    request: Request,
    data: GetLocationRequest,
    geo: Annotated[GeoService, Depends(get_geo_service)],
) -> GetLocationResponse:
    latitude = geo.dms_to_degrees(data.degrees_n, data.minutes_n, data.seconds_n)
    longitude = geo.dms_to_degrees(data.degrees_e, data.minutes_e, data.seconds_e)
    location = geo.get_location_names(latitude, longitude)
    return GetLocationResponse(
        country=location.country,
        region=location.region,
        district=location.district,
    )
