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
        adm_country=record_data.adm_country,
        adm_region=record_data.adm_region,
        adm_district=record_data.adm_district,
        adm_loc=record_data.adm_loc,
        geo_nn_raw=record_data.geo_nn_raw,
        geo_ee_raw=record_data.geo_ee_raw,
        geo_origin=record_data.geo_origin,
        geo_REM=record_data.geo_REM,
        eve_YY=record_data.eve_YY,
        eve_MM=record_data.eve_MM,
        eve_DD=record_data.eve_DD,
        eve_day_def=record_data.eve_day_def,
        eve_habitat=record_data.eve_habitat,
        eve_effort=record_data.eve_effort,
        abu_coll=record_data.abu_coll,
        eve_REM=record_data.eve_REM,
        tax_fam=record_data.tax_fam,
        tax_gen=record_data.tax_gen,
        tax_sp=record_data.tax_sp,
        tax_sp_def=record_data.tax_sp_def,
        tax_nsp=record_data.tax_nsp,
        type_status=record_data.type_status,
        tax_REM=record_data.tax_REM,
        abu=record_data.abu,
        abu_details=record_data.abu_details,
        abu_ind_rem=record_data.abu_ind_rem,
        geo_uncert=record_data.geo_uncert,
        eve_YY_end=record_data.eve_YY_end,
        eve_MM_end=record_data.eve_MM_end,
        eve_DD_end=record_data.eve_DD_end,
    )
