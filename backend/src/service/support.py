import aiohttp

from core.config import ADMIN_CHAT_ID, BOT_TOKEN
from schemas import SupportRequest


async def send_message(
    session: aiohttp.ClientSession,
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
        "chat_id": ADMIN_CHAT_ID,
        "text": message,
        "parse_mode": "HTML",
    }

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    async with session.post(url, json=message_payload) as response:
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
    # FIXME: wtf
    return issue_types.get(issue_type, issue_type)
