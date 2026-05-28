import logging
from typing import Annotated

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Request, status

from core.dependencies import HTTPClient
from core.rate_limiter import limiter
from schema.common import SupportRequest
from service import telegram
from service.user import UserService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/support", tags=["support"])


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("1/minute")
async def submit_support(
    request: Request,
    data: SupportRequest,
    client: HTTPClient,
    user_service: Annotated[UserService, Depends()],
) -> None:
    user = await user_service.find_by_username(data.user_name)

    try:
        await telegram.support_message(client, data, user.user_id if user else None)
    except (aiohttp.ClientError, OSError) as e:
        logger.error("Failed to process support request: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"failed to process support request: {str(e)}"
        ) from e
