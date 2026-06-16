from collections.abc import Awaitable, Callable
from typing import Any

from aiogram import BaseMiddleware
from aiogram.types import TelegramObject

from bot.i18n import BotLanguage, detect_language

import logging
logger = logging.getLogger(__name__)


class LanguageMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        lang: BotLanguage = "en"

        user = getattr(event, "from_user", None)
        if user is not None:
            lang = detect_language(user.language_code)

        logger.info("Language for user %s: %s", user.id, lang)
        data["lang"] = lang
        return await handler(event, data)
