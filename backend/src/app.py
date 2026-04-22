import asyncio
import json
import logging
from contextlib import asynccontextmanager
from logging.handlers import TimedRotatingFileHandler

import aiohttp
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

import bot
from api import api_router
from core.config import settings
from core.database import init_db, ping_db
from core.rate_limiter import limiter, rate_limit_handler

log_format = "%(asctime)s %(levelname)s [%(filename)s:%(lineno)d] %(message)s"

handlers = []

handler = logging.StreamHandler()

handler.setLevel(logging.DEBUG)
handler.setFormatter(logging.Formatter(log_format))

handlers.append(handler)

if not settings.DEV_MODE:
    settings.LOGS_DIR.mkdir(exist_ok=True)

    app_handler = TimedRotatingFileHandler(
        filename=settings.LOGS_DIR / "service.log",
        when="midnight",
        backupCount=30,
        encoding="utf-8",
    )
    app_handler.setLevel(logging.DEBUG)
    app_handler.setFormatter(logging.Formatter(log_format))

    error_handler = TimedRotatingFileHandler(
        filename=settings.LOGS_DIR / "errors.log",
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
    level=logging.getLevelName(settings.LOG_LEVEL),
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
                app.state.location_data = json.load(f)
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


app = FastAPI(lifespan=lifespan)

logger = logging.getLogger(__name__)
logger.info(f"Running in {'DEVELOPMENT' if settings.DEV_MODE else 'PRODUCTION'} mode")
logger.info(f"Allowed origins: {settings.ALLOWED_ORIGINS}")

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["set-cookie", "Content-Disposition"],
)

app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

app.include_router(api_router)

if __name__ == "__main__":
    asyncio.run(bot.start())
