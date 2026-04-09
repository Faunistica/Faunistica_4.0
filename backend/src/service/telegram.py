import io
import logging

import aiohttp

from config.config import BOT_TOKEN

logger = logging.getLogger(__name__)


class TelegramService:
    async def fetch_telegram_photo(
        self,
        session: aiohttp.ClientSession,
        user_id: int,
    ) -> io.BytesIO | None:
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
            # TODO: Streaming response?
            return io.BytesIO(await file_resp.read())


_telegram_service: TelegramService | None = None


def get_telegram_service() -> TelegramService:
    global _telegram_service
    if _telegram_service is None:
        _telegram_service = TelegramService()
    return _telegram_service
