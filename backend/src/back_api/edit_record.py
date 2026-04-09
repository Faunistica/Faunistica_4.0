import logging
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from back_api.rate_limiter import limiter
from back_api.schemas import EditRecordRequest, Message
from database.database import get_session
from database.hash import decrypt_id
from repository.record import edit_record_by_id
from service.token import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/edit_record")
@limiter.limit("20/minute")
async def edit_record(
    request: Request,
    data: EditRecordRequest,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Message:
    user_id = int(user_data["sub"])
    record_id = decrypt_id(data.hash)
    if record_id is None:
        logger.warning("Invalid record token")
        raise HTTPException(status_code=400, detail="Invalid record token.")

    try:
        dump = data.model_dump()
        dump["datetime"] = datetime.now(UTC).replace(tzinfo=None, microsecond=0)
        dump["type"] = "rec_ok"
        is_success = await edit_record_by_id(session, record_id, user_id, dump)

    except Exception as e:
        logger.error(f"Server database error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Server database error.") from e

    if is_success:
        return Message(message="ok")

    logger.warning("Record not found or not owned by user")
    raise HTTPException(
        status_code=404, detail="Record not found or not owned by user."
    )
