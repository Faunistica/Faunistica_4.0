import logging
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Request

from core.dependencies import DBSession, TokenUser
from core.rate_limiter import limiter
from repository import record
from schemas.common import Message
from schemas.records import EditRecordRequest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.put("/{record_id}")
@limiter.limit("20/minute")
async def update_record(
    request: Request,
    record_id: int,
    data: EditRecordRequest,
    token: TokenUser,
    session: DBSession,
) -> Message:
    """
    Обновление существующей записи.

    Обновляет поля записи новыми данными.
    """
    try:
        # Заменить на (наверное)
        # Преобразуем поля из запроса (старые имена) в новые атрибуты модели
        # update_dict = {
        #     "type": "rec_ok",
        #     "datetime": datetime.now(UTC).replace(tzinfo=None, microsecond=0),
        #     "country": data.adm_country,
        #     "region": data.adm_region,
        #     "district": data.adm_district,
        #     "locality": data.adm_loc,
        #     "verbatimlatitude": data.geo_nn_raw,
        #     "verbatimlongitude": data.geo_ee_raw,
        #     "georef_source": data.geo_origin,
        #     "location_remarks": data.geo_REM,
        #     "year": data.eve_YY,
        #     "month": data.eve_MM,
        #     "day": data.eve_DD,
        #     "day_defined": data.eve_day_def,
        #     "habitat": data.eve_habitat,
        #     "sampling_effort": data.eve_effort,
        #     "recorded_by": data.abu_coll,
        #     "event_remarks": data.eve_REM,
        #     "family": data.tax_fam,
        #     "genus": data.tax_gen,
        #     "species": data.tax_sp,
        #     "taxon_rank": data.tax_sp_def,
        #     "is_new_species": data.tax_nsp,
        #     "type_status": data.type_status,
        #     "taxon_remarks": data.tax_REM,
        #     "quantity": data.abu,
        #     "abu_details": data.abu_details,
        #     "occurrence_remarks": data.abu_ind_rem,
        #     "uncertainty": data.geo_uncert,
        #     "year_end": data.eve_YY_end,
        #     "month_end": data.eve_MM_end,
        #     "day_end": data.eve_DD_end,
        # }
        # # Удаляем None значения, чтобы не затирать существующие
        # update_dict = {k: v for k, v in update_dict.items() if v is not None}

        # is_success = await records.update(session, record_id, user_id, update_dict)

        dump = data.model_dump()
        dump["datetime"] = datetime.now(UTC).replace(tzinfo=None, microsecond=0)
        dump["type"] = "rec_ok"
        is_success = await record.update_record(session, record_id, token.user_id, dump)

    except Exception as e:
        logger.error(f"Server database error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Server database error.") from e

    if is_success:
        return Message(message="ok")

    logger.warning("Record not found or not owned by user")
    raise HTTPException(
        status_code=404, detail="Record not found or not owned by user."
    )
