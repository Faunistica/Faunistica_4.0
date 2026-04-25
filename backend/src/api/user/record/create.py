import logging

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from core.dependencies import ClientIP, DBSession
from core.rate_limiter import limiter
from repository import record

logger = logging.getLogger(__name__)
router = APIRouter()


class RecordCreated(BaseModel):
    id: int


@router.post("/", status_code=201)
@limiter.limit("5/minute")
async def create_record(
    request: Request,
    data: record.RecordBase,
    ip: ClientIP,
    session: DBSession,
) -> RecordCreated:
    """
    Создание новой записи наблюдения вида.

    Создает новую запись с данными таксономии, географии и экземпляров.
    """
    try:
        new_id = await record.create_record(session, data, ip)
        return RecordCreated(id=new_id)
    except Exception as e:
        logger.error(f"Server database error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Server database error: {str(e)}"
        ) from e
