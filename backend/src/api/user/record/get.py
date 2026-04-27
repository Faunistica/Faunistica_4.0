import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request

from core.dependencies import DBSession
from core.rate_limiter import limiter
from repository import record
from schemas.records import RecordFull

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{record_id}")
@limiter.limit("20/minute")
async def get_record(
    request: Request,
    user_id: int,
    record_id: UUID,
    session: DBSession,
) -> RecordFull:
    """
    Получение деталей одной записи.

    Возвращает полные данные конкретной записи по ID.
    """
    try:
        data = await record.get_record(session, record_id, user_id)
    except Exception as e:
        logger.error(f"Server database error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Server database error.") from e

    if not data:
        logger.warning("Record not found or not owned by user")
        raise HTTPException(
            status_code=404, detail="Record not found or not owned by user."
        )

    return RecordFull.model_validate(data)
