import logging

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from core.dependencies import HTTPClient
from core.rate_limiter import limiter
from service import telegram

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/me/photo")
@limiter.limit("1/minute")
async def get_photo(
    request: Request, user_id: int, client: HTTPClient
) -> StreamingResponse:
    photo = await telegram.fetch_photo(client, user_id)
    if not photo:
        logger.warning("No photo found")
        raise HTTPException(404, detail="No photo found")
    return StreamingResponse(photo, media_type="image/jpeg")
