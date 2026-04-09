import logging
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from back_api.rate_limiter import limiter
from database.database import get_session
from service.record import RecordExcelService, get_record_excel_service
from service.record_service import RecordService, get_record_service
from service.token import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/get_records_data")
@limiter.limit("1/minute")
async def get_records_data(
    request: Request,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    records_svc: Annotated[RecordService, Depends(get_record_service)],
    records_excel: Annotated[RecordExcelService, Depends(get_record_excel_service)],
) -> StreamingResponse:
    user_id = int(user_data["sub"])
    username = user_data["username"]
    try:
        records = await records_svc.get_records(session, user_id)

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
            records_excel.generate_excel(records),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers,
        )

    except Exception as e:
        logger.error(f"Exception in get_records_data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) from e
