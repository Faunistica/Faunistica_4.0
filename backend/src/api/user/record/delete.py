import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status

from core.dependencies import DBSession
from core.rate_limiter import limiter
from repository import record

logger = logging.getLogger(__name__)
router = APIRouter()


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/minute")
async def delete_record(
    request: Request,
    record_id: UUID,
    user_id: int,
    session: DBSession,
) -> None:
    """
    Удаление записи.

    Удаляет запись навсегда.
    """
    try:
        is_success = await record.delete_record(session, record_id, user_id)
    except Exception as e:
        logger.error(f"Server database error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Server database error.") from e

    if is_success:
        return

    logger.warning("Record not found or not owned by user")
    raise HTTPException(
        status_code=404, detail="Record not found or not owned by user."
    )
