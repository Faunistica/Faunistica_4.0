import logging
from typing import Annotated

import aiohttp
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from api.util import get_http_session
from service import telegram

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/me/photo")
async def get_photo(
    user_id: int,
    session: Annotated[aiohttp.ClientSession, Depends(get_http_session)],
) -> StreamingResponse:
    photo = await telegram.fetch_photo(session, user_id)
    if not photo:
        logger.warning("No photo found")
        raise HTTPException(404, detail="No photo found")
    return StreamingResponse(photo, media_type="image/jpeg")
