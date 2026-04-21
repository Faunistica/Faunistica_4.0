import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.exceptions import TelegramAPIError
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.methods import DeleteWebhook

from bot.handlers import Handlers
from config import config
from database.database import get_session

logger = logging.getLogger(__name__)


async def bot_start() -> None:
    global bot_instance, dp_instance

    session = None
    if len(config.BOT_PROXY) > 0:
        session = AiohttpSession(proxy=config.BOT_PROXY)
        logger.info(f"Bot session configured with proxy: {config.BOT_PROXY}")

    bot_instance = Bot(token=config.BOT_TOKEN, session=session)
    dp_instance = Dispatcher(storage=MemoryStorage())

    handlers = Handlers(bot_instance, get_session)
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
