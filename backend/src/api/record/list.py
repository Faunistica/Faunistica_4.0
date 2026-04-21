import logging
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from api.rate_limiter import limiter
from core.database import get_session
from core.security import get_current_user, validate_user_id
from repository import record as record_repo
from service import export

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
@limiter.limit("1/minute")
async def list_records(
    request: Request,
    user_id: int,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    _: Annotated[None, Depends(validate_user_id)],
) -> StreamingResponse:
    user_id = int(user_data["sub"])
    username = user_data["username"]
    try:
        records = await record_repo.get_user_records(session, user_id)

        if not records:
            logger.warning(f"No records found for user: {username} - {user_id}")
            raise HTTPException(
                status_code=404, detail="No records found for this user"
            )

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        headers = {
            "Content-Disposition": f"attachment; filename=records_{timestamp}.xlsx",
            "Access-Control-Expose-Headers": "Content-Disposition",
        }

        return StreamingResponse(
            export.records_to_excel(records),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers,
        )

    except Exception as e:
        logger.error(f"Exception in list_records: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) from e
