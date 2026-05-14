import logging

from fastapi import APIRouter, HTTPException, Request, status

from core.dependencies import DBSession, HTTPClient
from core.rate_limiter import limiter
from repository.user import find_user_by_username
from schema.common import SupportRequest
from service import telegram

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/support", tags=["support"])


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("1/minute")
async def submit_support(
    request: Request,
    data: SupportRequest,
    session: DBSession,
    client: HTTPClient,
) -> None:
    """
    Отправка запроса в поддержку.

    Создает запрос в поддержку, который отправляется в Telegram.
    """
    user = await find_user_by_username(session, data.user_name)

    try:
        await telegram.support_message(client, data, user.user_id if user else None)
    except Exception as e:
        logger.error(f"Failed to process support request: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"failed to process support request: {str(e)}"
        ) from e
