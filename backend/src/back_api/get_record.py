import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from back_api.rate_limiter import limiter
from back_api.schemas import GetRecordRequest, GetRecordResponse
from back_api.token import get_current_user
from database.crud import get_record_by_id
from database.database import get_session
from database.hash import decrypt_id

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/get_record")
@limiter.limit("20/minute")
async def insert_record(
    request: Request,
    data: GetRecordRequest,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> GetRecordResponse:
    user_id = int(user_data["sub"])
    try:
        record_id = decrypt_id(data.hash)
    except Exception as e:
        logger.warning("Invalid record token")
        raise HTTPException(status_code=400, detail="Invalid record token.") from e

    try:
        record_data = await get_record_by_id(session, record_id, user_id)
    except Exception as e:
        logger.error(f"Server database error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Server database error.") from e

    if not record_data:
        logger.warning("Record not found or not owned by user")
        raise HTTPException(
            status_code=404, detail="Record not found or not owned by user."
        )

    record_data.hash = data.hash
    return record_data
