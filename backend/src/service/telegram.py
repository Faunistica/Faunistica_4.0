import io
import logging

import aiohttp

from core.config import settings

logger = logging.getLogger(__name__)


# NOTE: probably should cache
async def fetch_photo(
    client: aiohttp.ClientSession,
    user_id: int,
) -> io.BytesIO | None:
    bot_token = settings.BOT_TOKEN.get_secret_value()
    url = f"https://api.telegram.org/bot{bot_token}/getUserProfilePhotos"
    async with client.get(url, params={"user_id": user_id, "limit": 1}) as resp:
        data = await resp.json()

    photos = data.get("result", {}).get("photos", [])
    if not photos:
        return None

    file_id = photos[0][-1]["file_id"]
    file_info_url = f"https://api.telegram.org/bot{bot_token}/getFile"
    async with client.get(file_info_url, params={"file_id": file_id}) as file_info_resp:
        file_info = await file_info_resp.json()

    file_path = file_info["result"]["file_path"]
    file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
    async with client.get(file_url) as file_resp:
        # TODO: Streaming response?
        return io.BytesIO(await file_resp.read())
