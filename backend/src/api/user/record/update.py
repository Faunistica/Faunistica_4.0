import logging

from fastapi import APIRouter, HTTPException, Request

from core.dependencies import DBSession
from core.rate_limiter import limiter
from repository import record
from schemas.common import Message
from schemas.records import RecordUpdate

logger = logging.getLogger(__name__)
router = APIRouter()


@router.put("/{record_id}")
@limiter.limit("20/minute")
async def update_record(
    request: Request,
    record_id: int,
    data: RecordUpdate,
    user_id: int,
    session: DBSession,
) -> Message:
    """
    Обновление существующей записи.

    Обновляет поля записи новыми данными.
    """
    try:
        is_success = await record.update_record(session, record_id, user_id, data)
    except Exception as e:
        logger.error(f"Server database error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Server database error.") from e

    if is_success:
        return Message(message="ok")

    logger.warning("Record not found or not owned by user")
    raise HTTPException(
        status_code=404, detail="Record not found or not owned by user."
    )
