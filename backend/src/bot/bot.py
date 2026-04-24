import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.exceptions import TelegramAPIError
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.methods import DeleteWebhook

from bot.handlers import Handlers
from core.config import settings

logger = logging.getLogger(__name__)


async def start() -> None:
    session = None
    if settings.BOT_PROXY is not None:
        session = AiohttpSession(proxy=settings.BOT_PROXY.unicode_string())
        logger.info(f"Bot session configured with proxy: {settings.BOT_PROXY}")

    bot_instance = Bot(token=settings.BOT_TOKEN.get_secret_value(), session=session)
    dp_instance = Dispatcher(storage=MemoryStorage())

    handlers = Handlers(bot_instance)
    dp_instance.include_router(handlers.router)

    try:
        await bot_instance(DeleteWebhook(drop_pending_updates=True))
        logger.info("Bot started polling")
        await dp_instance.start_polling(bot_instance, handle_signals=False)
    except asyncio.CancelledError:
        logger.info("Shutting down bot...")
    except TelegramAPIError as api_error:
        logger.error(f"Telegram API error: {api_error}", exc_info=True)
        raise
    except Exception as polling_error:
        logger.error(f"Polling failed: {polling_error}", exc_info=True)
    finally:
        logger.info("Closing bot session...")
        await bot_instance.session.close()
