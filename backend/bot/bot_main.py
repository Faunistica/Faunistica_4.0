import logging

from aiogram import Bot, Dispatcher
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.exceptions import TelegramAPIError
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.methods import DeleteWebhook

from bot.handlers import Handlers
from config import config
from database.database import get_session, init_db

logger = logging.getLogger(__name__)


async def bot_start() -> None:
    try:
        session = None
        if config.BOT_PROXY:
            session = AiohttpSession(proxy=config.BOT_PROXY)
            logger.info(f"Bot session configured with proxy: {config.BOT_PROXY}")

        bot = Bot(token=config.BOT_TOKEN, session=session)
        dp = Dispatcher(storage=MemoryStorage())

        try:
            await init_db()
        except Exception as db_error:
            logger.error(f"Database initialization failed: {db_error}", exc_info=True)
            raise

        handlers = Handlers(bot, get_session)
        dp.include_router(handlers.router)

        try:
            await bot(DeleteWebhook(drop_pending_updates=True))
            await dp.start_polling(bot)
        except TelegramAPIError as api_error:
            logger.error(f"Telegram API error: {api_error}", exc_info=True)
            raise
        except Exception as polling_error:
            logger.error(f"Polling failed: {polling_error}", exc_info=True)
            raise
        finally:
            await bot.session.close()
    except Exception as global_error:
        logger.critical(f"Bot crashed: {global_error}", exc_info=True)
        raise
