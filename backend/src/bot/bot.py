import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.exceptions import TelegramAPIError, TelegramRetryAfter
from aiogram.fsm.storage.memory import MemoryStorage

from bot.handlers import main_router
from bot.keyboards import setup_bot_commands
from bot.middlewares.language import LanguageMiddleware
from core.config import settings

logger = logging.getLogger(__name__)


async def start() -> None:
    session = None
    if settings.BOT_PROXY is not None:
        session = AiohttpSession(proxy=settings.BOT_PROXY.unicode_string())
        logger.info("Bot session configured with proxy: %s", settings.BOT_PROXY)

    bot_instance = Bot(token=settings.BOT_TOKEN.get_secret_value(), session=session)
    dp_instance = Dispatcher(storage=MemoryStorage())

    dp_instance.include_router(main_router)

    dp_instance.message.outer_middleware.register(LanguageMiddleware())

    try:
        await bot_instance.delete_webhook(drop_pending_updates=True)
        bot_info = await bot_instance.get_me()
        settings.BOT_USERNAME = bot_info.username
        logger.info("Bot USERNAME: %s", bot_info.username)
        await setup_bot_commands(bot_instance)
        logger.info("Bot commands and menu button set up")
        logger.info("Bot started polling")
        await dp_instance.start_polling(bot_instance, handle_signals=False)
    except asyncio.CancelledError:
        logger.info("Shutting down bot...")
    except TelegramAPIError as api_error:
        logger.error("Telegram API error: %s", api_error, exc_info=True)
        raise
    except (TelegramRetryAfter, OSError) as polling_error:
        logger.error("Polling failed: %s", polling_error, exc_info=True)
    finally:
        logger.info("Closing bot session...")
        await bot_instance.session.close()
