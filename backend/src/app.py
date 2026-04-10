import asyncio
import json
import logging
from contextlib import asynccontextmanager
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path

import aiohttp
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from api import api_router
from api.rate_limiter import limiter, rate_limit_handler
from bot.bot_main import bot_start, config
from config.config import ALLOWED_ORIGINS, DEV_MODE, LOG_LEVEL, LOGS_DIR
from database.database import init_db, ping_db

logs_dir = LOGS_DIR
logs_dir.mkdir(exist_ok=True)

log_format = "%(asctime)s %(levelname)s [%(filename)s:%(lineno)d] %(message)s"

handlers = []

if config.DEV_MODE:
    handler = logging.StreamHandler()

    handler.setLevel(logging.DEBUG)
    handler.setFormatter(logging.Formatter(log_format))

    handlers.append(handler)
else:
    app_handler = TimedRotatingFileHandler(
        filename=logs_dir / "service.log",
        when="midnight",
        backupCount=30,
        encoding="utf-8",
    )
    app_handler.setLevel(logging.DEBUG)
    app_handler.setFormatter(logging.Formatter(log_format))

    error_handler = TimedRotatingFileHandler(
        filename=logs_dir / "errors.log",
        when="midnight",
        backupCount=90,
        encoding="utf-8",
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(logging.Formatter(log_format))

    handlers.append(
        app_handler,
    )
    handlers.append(
        error_handler,
    )


logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.WARNING),
    handlers=handlers,
    format=log_format,
    force=True,
)

third_party_libs = {
    "aiogram": logging.CRITICAL,
    "uvicorn": logging.WARNING,
    "fastapi": logging.WARNING,
    "sqlalchemy": logging.WARNING,
    "sqlalchemy.engine": logging.WARNING,
    "sqlalchemy.engine.Engine": logging.WARNING,
    "sqlalchemy.pool": logging.WARNING,
    "aiohttp": logging.WARNING,
}

for lib_name, level in third_party_libs.items():
    logging.getLogger(lib_name).setLevel(level)


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ANN201
    logger = logging.getLogger(__name__)

    await init_db()

    if len(config.BOT_PROXY) > 0:
        app.state.http_session = aiohttp.ClientSession(proxy=config.BOT_PROXY)
        logger.info(f"HTTP session configured with proxy: {config.BOT_PROXY}")
    else:
        app.state.http_session = aiohttp.ClientSession()
        logger.info("HTTP session created without proxy")

    json_path = Path(__file__).resolve().parent.parent / "locations.json"  # noqa: ASYNC240
    if json_path.exists():
        try:
            with open(json_path, encoding="utf-8") as f:  # noqa: ASYNC230
                app.state.location_data = json.load(f)
            logger.info("Location data loaded")
        except Exception as e:
            logger.error(f"Failed to load location data: {e}", exc_info=True)
            app.state.location_data = []
    else:
        logger.warning(f"Location data file not found at {json_path}")
        app.state.location_data = []

    try:
        bot_task = asyncio.create_task(bot_start())
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


app = FastAPI(lifespan=lifespan)

logger = logging.getLogger(__name__)
logger.info(f"Running in {'DEVELOPMENT' if DEV_MODE else 'PRODUCTION'} mode")
logger.info(f"Allowed origins: {ALLOWED_ORIGINS}")

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["set-cookie", "Content-Disposition"],
)

app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

app.include_router(api_router)

if __name__ == "__main__":
    asyncio.run(bot_start())
