import asyncio
import json
import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import aiohttp
from fastapi import FastAPI

from bot import bot
from core.config import settings
from core.database import init_db, ping_db
from schema.geo import RegionData


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    logger = logging.getLogger(__name__)

    await init_db()

    if settings.BOT_PROXY is not None:
        app.state.http_session = aiohttp.ClientSession(
            proxy=settings.BOT_PROXY.unicode_string()
        )
        logger.info(f"HTTP session configured with proxy: {settings.BOT_PROXY}")
    else:
        app.state.http_session = aiohttp.ClientSession()
        logger.info("HTTP session created without proxy")

    json_path = settings.LOCATIONS_JSON_PATH
    if json_path.exists():
        try:
            with open(json_path, encoding="utf-8") as f:  # noqa: ASYNC230
                raw_data = json.load(f)
                app.state.location_data = [RegionData(**item) for item in raw_data]
            logger.info("Location data loaded")
        except Exception as e:
            logger.error(f"Failed to load location data: {e}", exc_info=True)
            app.state.location_data = []
    else:
        logger.warning(f"Location data file not found at {json_path}")
        app.state.location_data = []

    try:
        bot_task = asyncio.create_task(bot.start())
    except Exception as db_error:
        logger.error(f"Database initialization failed: {db_error}", exc_info=True)
        raise

    if not await ping_db():
        logger.critical("Database is not available. Application cannot start.")
        raise RuntimeError("Database connection failed")

    logger.info("Database connection verified")

    try:
        yield
    finally:
        logger.info("Closing HTTP session...")
        await app.state.http_session.close()
        logger.info("Shutting down bot...")
        bot_task.cancel()
        await bot_task
