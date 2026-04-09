import logging
from typing import Annotated

import aiohttp
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from back_api.util import get_http_session
from service.telegram import fetch_telegram_photo

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/user_photo")
async def stream_photo(
    user_id: int,
    session: Annotated[aiohttp.ClientSession, Depends(get_http_session)],
) -> StreamingResponse:
    photo = await fetch_telegram_photo(session, user_id)
    if not photo:
        logger.warning("No photo found")
        raise HTTPException(404, detail="No photo found")
    return StreamingResponse(photo, media_type="image/jpeg")
