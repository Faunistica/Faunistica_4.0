import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from back_api.rate_limiter import limiter
from back_api.schemas import PublResponse, RecordHashRequest
from database.database import get_session
from database.hash import decrypt_id
from service.record import RecordService, get_record_service
from service.token import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()
base_url = "https://faunistica.ru/files/"


# FIXME: post?
@router.post("/publ_from_hash")
@limiter.limit("666/minute")
async def get_publ_from_hash(
    request: Request,
    data: RecordHashRequest,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    records_svc: Annotated[RecordService, Depends(get_record_service)],
) -> PublResponse:
    try:
        user_id = int(user_data["sub"])
        record_id = decrypt_id(data.hash)

        if record_id is None:
            logger.warning("Invalid record token")
            raise HTTPException(status_code=400, detail="Invalid record token.")

        publ = await records_svc.get_publication_by_hash(session, record_id, user_id)
        if publ is None:
            logger.warning("Publication not found")
            raise HTTPException(status_code=404, detail="Publication not found.")

        return PublResponse(
            author=publ.author,
            year=publ.year,
            name=publ.name,
            pdf_file=base_url + publ.pdf_file if publ.pdf_file else None,
        )

    except Exception as e:
        logger.error(f"HTTP Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Server database error: {str(e)}"
        ) from e
