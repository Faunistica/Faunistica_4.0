import logging
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.rate_limiter import limiter
from api.schemas import InsertRecordsRequest, Message
from api.util import clean_value
from database.database import get_session
from service.geo import GeoService
from service.record import RecordService
from service.specimen import SpecimenService
from service.token import get_current_user
from service.user import UserService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/insert_record")
@limiter.limit("5/minute")
async def insert_record(
    request: Request,
    data: InsertRecordsRequest,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    geo: Annotated[GeoService, Depends()],
    specimen: Annotated[SpecimenService, Depends()],
    users: Annotated[UserService, Depends()],
    records_svc: Annotated[RecordService, Depends()],
) -> Message:
    north = geo.parse_coordinate(data.north)
    east = geo.parse_coordinate(data.east)
    sp, num = specimen.parse(clean_value(data.specimens))
    user_info = await users.get_by_id(session, int(user_data["sub"]))
    record_json = {
        "publ_id": user_info.publ_id,
        "user_id": user_info.id,
        "datetime": datetime.now(UTC).replace(tzinfo=None, microsecond=0),
        "ip": None,
        "errors": None,
        "type": "rec_ok",
        "adm_country": clean_value(data.country),
        "adm_region": clean_value(data.region),
        "adm_district": clean_value(data.district),
        "adm_loc": clean_value(data.place),
        "geo_nn": clean_value(north),
        "geo_ee": clean_value(east),
        "geo_nn_raw": clean_value(data.north),
        "geo_ee_raw": clean_value(data.east),
        "geo_origin": clean_value(data.geo_origin),
        "geo_REM": clean_value(data.geo_REM),
        "eve_YY": clean_value(data.begin_year),
        "eve_MM": clean_value(data.begin_month),
        "eve_DD": clean_value(data.begin_day),
        "eve_day_def": clean_value(data.begin_day) is not None,
        "eve_habitat": clean_value(data.biotope),
        "eve_effort": clean_value(data.selective_gain),
        "abu_coll": clean_value(data.collector),
        "eve_REM": clean_value(data.eve_REM),
        "tax_fam": clean_value(data.family),
        "tax_gen": clean_value(data.genus),
        "tax_sp": clean_value(data.species),
        "tax_sp_def": clean_value(data.is_defined_species) is not None,
        "tax_nsp": clean_value(data.is_new_species) is not None,
        "type_status": clean_value(data.type_status),
        "tax_REM": clean_value(data.taxonomic_notes),
        "abu": num,
        "abu_details": sp,
        "abu_ind_rem": clean_value(data.abu_ind_rem),
        "geo_uncert": clean_value(data.geo_uncert),
        "eve_YY_end": clean_value(data.end_year),
        "eve_MM_end": clean_value(data.end_month),
        "eve_DD_end": clean_value(data.end_day),
        "adm_verbatim": "1",
    }

    try:
        await records_svc.add_record(session, record_json)
        return Message(message="ok")
    except Exception as e:
        logger.error(f"Server database error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Server database error: {str(e)}"
        ) from e
