import io
import logging
from typing import Annotated

import aiohttp
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from back_api.util import get_http_session
from config.config import BOT_TOKEN

logger = logging.getLogger(__name__)
router = APIRouter()


async def fetch_telegram_photo(
    session: aiohttp.ClientSession,
    user_id: int,
):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUserProfilePhotos"
    async with session.get(url, params={"user_id": user_id, "limit": 1}) as resp:
        data = await resp.json()

    photos = data.get("result", {}).get("photos", [])
    if not photos:
        return None

    file_id = photos[0][-1]["file_id"]
    file_info_url = f"https://api.telegram.org/bot{BOT_TOKEN}/getFile"
    async with session.get(
        file_info_url, params={"file_id": file_id}
    ) as file_info_resp:
        file_info = await file_info_resp.json()

    file_path = file_info["result"]["file_path"]
    file_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}"
    async with session.get(file_url) as file_resp:
        return io.BytesIO(await file_resp.read())


@router.get("/user_photo")
async def stream_photo(
    user_id: int,
    session: Annotated[aiohttp.ClientSession, Depends(get_http_session)],
):
    photo = await fetch_telegram_photo(session, user_id)
    if not photo:
        logger.warning("No photo found")
        raise HTTPException(404, detail="No photo found")
    return StreamingResponse(photo, media_type="image/jpeg")
