import logging

from fastapi import APIRouter, HTTPException, Request

from core.dependencies import DBSession, TokenUser
from core.rate_limiter import limiter
from repository import record
from schemas.common import Message

logger = logging.getLogger(__name__)
router = APIRouter()


@router.delete("/{record_id}")
@limiter.limit("20/minute")
async def delete_record(
    request: Request,
    record_id: int,
    token: TokenUser,
    session: DBSession,
) -> Message:
    try:
        is_success = await record.delete_record(session, record_id, token.user_id)
    except Exception as e:
        logger.error(f"Server database error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Server database error.") from e

    if is_success:
        return Message(message="ok")

    logger.warning("Record not found or not owned by user")
    raise HTTPException(
        status_code=404, detail="Record not found or not owned by user."
    )
