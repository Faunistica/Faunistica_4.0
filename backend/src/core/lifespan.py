import asyncio
import json
import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

import aiohttp
from alembic.config import Config
from alembic.script import ScriptDirectory
from fastapi import FastAPI
from sqlalchemy import text

from bot import bot
from core.check_schema import run_check_schema
from core.config import settings
from core.database import _engine, init_db, ping_db
from schema.geo import RegionData

_ALEMBIC_CFG_PATH = Path(__file__).resolve().parent.parent.parent / "alembic.ini"

logger = logging.getLogger(__name__)


async def _check_migrations() -> None:
    """Verify DB schema matches Alembic head revision."""
    cfg = Config(str(_ALEMBIC_CFG_PATH))
    script = ScriptDirectory.from_config(cfg)
    head_rev = script.get_current_head()

    try:
        async with _engine.connect() as conn:
            result = await conn.execute(text("SELECT version_num FROM alembic_version"))
            row = result.fetchone()
            db_rev = row[0] if row else None
    except Exception:
        db_rev = None

    if db_rev != head_rev:
        msg = (
            f"Database is at revision {db_rev}, expected {head_rev}. "
            "Run `alembic upgrade head` to sync."
        )
        logger.critical(msg)
        raise RuntimeError(msg)

    logger.info("Alembic migrations are up to date (head: %s)", head_rev)


async def _check_schema_dev() -> None:
    """Fine-grained model-vs-DB schema check for dev mode only."""
    mismatches, warnings = await run_check_schema(_engine)
    if mismatches:
        logger.warning(
            "DEV: Schema mismatches found between models and DB "
            "(app will start, but fix before deploying):"
        )
        for m in mismatches:
            logger.warning("  %s", m)
    for w in warnings:
        logger.warning("DEV: Schema warning: %s", w)
    if not mismatches:
        logger.info("DEV: Model and DB schemas are in sync")
    else:
        raise RuntimeError("Model and DB schema are out of sync")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    await init_db()
    await _check_migrations()

    if settings.DEV_MODE:
        await _check_schema_dev()

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
