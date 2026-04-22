import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from api.dependencies import DBSession, Token
from api.rate_limiter import limiter
from repository import record
from service import export

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
@limiter.limit("1/minute")
async def list_records(
    request: Request,
    token: Token,
    session: DBSession,
) -> StreamingResponse:
    user_id = token.user_id
    username = token.username

    try:
        records = await record.get_user_records(session, user_id)

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
