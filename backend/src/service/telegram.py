import io
import logging

import aiohttp

from core.config import settings
from schema.common import SupportRequest

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


async def support_message(
    client: aiohttp.ClientSession,
    data: SupportRequest,
    user_id: int,
) -> None:
    message = (
        f"📢 Новое сообщение в поддержку из веб-формы 📢\n"
        f"🔗 Ссылка на Telegram: {data.link}\n"
        f"👤 Username в боте: {data.user_name if data.user_name else 'Не указан'}\n"
        f"🪪 ID: {user_id if user_id != -1 else 'Не найден'}\n"
        f"📋 Тип проблемы: {_get_issue_type(data.issue_type)}\n"
        f"\n"
        f"📝 Сообщение:\n"
        f"{data.text}\n"
    )

    message_payload = {
        "chat_id": settings.ADMIN_CHAT_ID,
        "text": message,
        "parse_mode": "HTML",
    }

    url = f"https://api.telegram.org/bot{settings.BOT_TOKEN.get_secret_value()}/sendMessage"
    async with client.post(url, json=message_payload) as response:
        response.raise_for_status()


def _get_issue_type(issue_type: str) -> str:
    issue_types = {
        "authorisation-website": "Проблемы с авторизацией на сайте",
        "authorisation-tg": "Проблемы с авторизацией в боте",
        "registration": "Проблемы с регистрацией в боте",
        "get-publication": "Проблемы с получением статьи",
        "autofill": "Проблемы с автозаполнением",
        "fill-by-hand": "Проблемы с заполнением вручную",
        "confirmation": "Проблемы с отправкой формы",
        "other": "Другая проблема",
    }
    return issue_types.get(issue_type, issue_type)
