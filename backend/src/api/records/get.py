import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.rate_limiter import limiter
from api.schemas import GetRecordResponse
from database.database import get_session
from database.hash import decrypt_id
from service.record import RecordService
from service.token import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{record_hash}")
@limiter.limit("20/minute")
async def get_record(
    request: Request,
    record_hash: str,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    records: Annotated[RecordService, Depends()],
) -> GetRecordResponse:
    user_id = int(user_data["sub"])
    try:
        record_id = decrypt_id(record_hash)
    except Exception as e:
        logger.warning("Invalid record token")
        raise HTTPException(status_code=400, detail="Invalid record token.") from e

    try:
        record_data = await records.get(session, record_id, user_id)
    except Exception as e:
        logger.error(f"Server database error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Server database error.") from e

    if not record_data:
        logger.warning("Record not found or not owned by user")
        raise HTTPException(
            status_code=404, detail="Record not found or not owned by user."
        )

    return GetRecordResponse(
        hash=record_hash,
        type=record_data.type,
        adm_country=record_data.country,       # в схеме пока старые имена
        adm_region=record_data.region,
        adm_district=record_data.district,
        adm_loc=record_data.locality,
        geo_nn_raw=record_data.verbatimlatitude,
        geo_ee_raw=record_data.verbatimlongitude,
        geo_origin=record_data.georef_source,
        geo_REM=record_data.location_remarks,
        eve_YY=record_data.year,
        eve_MM=record_data.month,
        eve_DD=record_data.day,
        eve_day_def=record_data.day_defined,
        eve_habitat=record_data.habitat,
        eve_effort=record_data.sampling_effort,
        abu_coll=record_data.recorded_by,
        eve_REM=record_data.event_remarks,
        tax_fam=record_data.family,
        tax_gen=record_data.genus,
        tax_sp=record_data.species,
        tax_sp_def=record_data.taxon_rank,
        tax_nsp=record_data.is_new_species,
        type_status=record_data.type_status,
        tax_REM=record_data.taxon_remarks,
        abu=record_data.quantity,
        abu_details=record_data.abu_details,
        abu_ind_rem=record_data.occurrence_remarks,
        geo_uncert=record_data.uncertainty,
        eve_YY_end=record_data.year_end,
        eve_MM_end=record_data.month_end,
        eve_DD_end=record_data.day_end,
    )