import logging
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.rate_limiter import limiter
from core.database import get_session
from core.security import get_current_user
from core.utils import clean_value
from repository.record import add_record_from_json
from repository.user import get_user
from schemas import InsertRecordsRequest, Message
from service.geo import GeoService
from service.specimen import SpecimenService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/")
@limiter.limit("5/minute")
async def create_record(  # noqa: PLR0913
    request: Request,
    data: InsertRecordsRequest,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    geo: Annotated[GeoService, Depends()],
    specimen: Annotated[SpecimenService, Depends()],
) -> Message:
    north = geo.parse_coordinate(data.north)
    east = geo.parse_coordinate(data.east)
    sp, num = specimen.parse(clean_value(data.specimens))
    user_info = await get_user(session, int(user_data["sub"]))
    record_json = {
        "publ_id": user_info.publ_id,
        "user_id": user_info.id,
        "datetime": datetime.now(UTC).replace(tzinfo=None, microsecond=0),
        "ip": None,
        "errors": None,
        "type": "rec_ok",
        "country": clean_value(data.country),
        "region": clean_value(data.region),
        "district": clean_value(data.district),
        "locality": clean_value(data.place),
        "latitude": clean_value(north),
        "longitude": clean_value(east),
        "verbatimlatitude": clean_value(data.north),
        "verbatimlongitude": clean_value(data.east),
        "georef_source": clean_value(data.geo_origin),
        "location_remarks": clean_value(data.geo_REM),
        "year": clean_value(data.begin_year),
        "month": clean_value(data.begin_month),
        "day": clean_value(data.begin_day),
        "day_defined": clean_value(data.begin_day) is not None,
        "habitat": clean_value(data.biotope),
        "sampling_effort": clean_value(data.selective_gain),
        "recorded_by": clean_value(data.collector),
        "event_remarks": clean_value(data.eve_REM),
        "family": clean_value(data.family),
        "genus": clean_value(data.genus),
        "species": clean_value(data.species),
        "taxon_rank": clean_value(data.is_defined_species) is not None,
        "is_new_species": clean_value(data.is_new_species) is not None,
        "type_status": clean_value(data.type_status),
        "taxon_remarks": clean_value(data.taxonomic_notes),
        "quantity": num,
        "quantity_type": None,
        "sex": None,
        "life_stage": None,
        "abu_details": sp,  # временно
        "occurrence_remarks": clean_value(data.abu_ind_rem),
        "uncertainty": clean_value(data.geo_uncert),
        "year_end": clean_value(data.end_year),
        "month_end": clean_value(data.end_month),
        "day_end": clean_value(data.end_day),
        "adm_verbatim": "1",
    }

    try:
        await add_record_from_json(session, record_json)
        return Message(message="ok")
    except Exception as e:
        logger.error(f"Server database error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Server database error: {str(e)}"
        ) from e
