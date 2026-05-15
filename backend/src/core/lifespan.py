import asyncio
import json
import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

import aiohttp
from alembic.command import check as check_alembic
from alembic.config import Config
from alembic.util.exc import CommandError
from fastapi import FastAPI

from bot import bot
from core.config import settings
from core.database import init_db, ping_db
from schema.geo import RegionData

_ALEMBIC_CFG_PATH = Path(__file__).resolve().parent.parent.parent / "alembic.ini"


def _check_migrations(logger: logging.Logger) -> None:
    """Verify DB schema matches Alembic head revision."""
    cfg = Config(str(_ALEMBIC_CFG_PATH))
    try:
        check_alembic(cfg)
    except CommandError as e:
        msg = (
            "Database schema is not at the Alembic head revision. "
            "Run `alembic upgrade head` to sync."
        )
        logger.critical(msg)
        raise RuntimeError(msg) from e
    logger.info("Alembic migrations are up to date")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    logger = logging.getLogger(__name__)

    await init_db()
    _check_migrations(logger)

    if not await ping_db():
        logger.critical("Database is not available. Application cannot start.")
        raise RuntimeError("Database connection failed")

    logger.info("Database connection verified")

    if settings.BOT_PROXY is not None:
        app.state.http_session = aiohttp.ClientSession(
            proxy=settings.BOT_PROXY.unicode_string()
        )
        logger.info("HTTP session configured with proxy: %s", settings.BOT_PROXY)
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
        except (FileNotFoundError, json.JSONDecodeError, OSError) as e:
            logger.error("Failed to load location data: %s", e, exc_info=True)
            app.state.location_data = []
    else:
        logger.warning("Location data file not found at %s", json_path)
        app.state.location_data = []

    try:
        bot_task = asyncio.create_task(bot.start())
    except OSError as db_error:
        logger.error("Database initialization failed: %s", db_error, exc_info=True)
        raise

    try:
        yield
    finally:
        logger.info("Closing HTTP session...")
        await app.state.http_session.close()
        logger.info("Shutting down bot...")
        bot_task.cancel()
        await bot_task
