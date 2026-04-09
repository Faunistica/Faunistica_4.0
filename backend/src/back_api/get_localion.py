import logging

from fastapi import APIRouter, Request

from back_api.schemas import GetLocationRequest, GetLocationResponse
from service import geo

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/get_loc")
async def get_loc(
    request: Request,
    data: GetLocationRequest,
) -> GetLocationResponse:
    latitude = geo.dms_to_dd(data.degrees_n, data.minutes_n, data.seconds_n)
    longitude = geo.dms_to_dd(data.degrees_e, data.minutes_e, data.seconds_e)
    location = geo.get_location_names(latitude, longitude)
    return GetLocationResponse(
        country=location.country,
        region=location.region,
        district=location.district,
    )
