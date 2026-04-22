import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.rate_limiter import limiter
from core.database import get_session
from core.security import get_request_user
from repository.record import get_record_by_id
from schemas.jwt import TokenPayload
from schemas.records import GetRecordResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{record_id}")
@limiter.limit("20/minute")
async def get_record(
    request: Request,
    record_id: int,
    token: Annotated[TokenPayload, Depends(get_request_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> GetRecordResponse:
    try:
        record_data = await get_record_by_id(session, record_id, token.user_id)
    except Exception as e:
        logger.error(f"Server database error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Server database error.") from e

    if not record_data:
        logger.warning("Record not found or not owned by user")
        raise HTTPException(
            status_code=404, detail="Record not found or not owned by user."
        )

    return GetRecordResponse(
        id=record_id,
        type=record_data.type,
        countrycode=record_data.country,
        stateprovince=record_data.region,
        county=record_data.district,
        verbatimlocality=record_data.locality,
        decimallatitude=record_data.latitude,
        decimallongitude=record_data.longitude,
        verbatimlatitude=record_data.verbatimlatitude,
        verbatimlongitude=record_data.verbatimlongitude,
        georeferencedby=record_data.georef_source,
        locationremarks=record_data.location_remarks,
        eve_YY=record_data.year,
        eve_MM=record_data.month,
        eve_DD=record_data.day,
        day_defined=record_data.day_defined,
        habitat=record_data.habitat,
        samplingeffort=record_data.sampling_effort,
        recordedby=record_data.recorded_by,
        eventremarks=record_data.event_remarks,
        family=record_data.family,
        genus=record_data.genus,
        specificepithet=record_data.species,
        taxonrank=record_data.taxon_rank,
        tax_nsp=record_data.is_new_species,
        type_status=record_data.type_status,
        taxonremarks=record_data.taxon_remarks,
        organismquantity=record_data.quantity,
        abu_details=record_data.abu_details,
        occurrenceremarks=record_data.occurrence_remarks,
        coordinateuncertaintyinmeters=record_data.uncertainty,
        eve_YY_end=record_data.year_end,
        eve_MM_end=record_data.month_end,
        eve_DD_end=record_data.day_end,
    )
