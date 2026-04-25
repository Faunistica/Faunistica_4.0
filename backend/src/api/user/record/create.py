import logging

from fastapi import APIRouter, HTTPException, Request, status

from core.dependencies import DBSession
from core.rate_limiter import limiter
from repository import record
from repository.user import get_user
from schemas.common import Message
from schemas.records import RecordBase

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/")
@limiter.limit("5/minute")
async def create_record(
    request: Request,
    data: RecordBase,
    user_id: int,
    session: DBSession,
) -> Message:
    """
    Создание новой записи наблюдения вида.

    Создает новую запись с данными таксономии, географии и экземпляров.
    """
    user = await get_user(session, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    try:
        await record.create_record(session, data)
        return Message(message="ok")
    except Exception as e:
        logger.error(f"Server database error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Server database error: {str(e)}"
        ) from e
