import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from api.dependencies import HTTPClient
from service import telegram

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/me/photo")
async def get_photo(user_id: int, client: HTTPClient) -> StreamingResponse:
    photo = await telegram.fetch_photo(client, user_id)
    if not photo:
        logger.warning("No photo found")
        raise HTTPException(404, detail="No photo found")
    return StreamingResponse(photo, media_type="image/jpeg")
