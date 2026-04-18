import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.rate_limiter import limiter
from api.schemas import Message
from core.security import get_current_user
from core.database import get_session
from database.hash import decrypt_id
from repository import record as record_repo

logger = logging.getLogger(__name__)
router = APIRouter()


@router.delete("/{record_hash}")
@limiter.limit("20/minute")
async def delete_record(
    request: Request,
    record_hash: str,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Message:
    user_id = int(user_data["sub"])
    record_id = decrypt_id(record_hash)
    if record_id is None:
        logger.warning("Invalid record token")
        raise HTTPException(status_code=400, detail="Invalid record token.")

    try:
        is_success = await record_repo.remove_record_row_by_id(
            session, record_id, user_id
        )
    except Exception as e:
        logger.error(f"Server database error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Server database error.") from e

    if is_success:
        return Message(message="ok")

    logger.warning("Record not found or not owned by user")
    raise HTTPException(
        status_code=404, detail="Record not found or not owned by user."
    )
