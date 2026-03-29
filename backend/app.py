import asyncio
import logging
from contextlib import asynccontextmanager
from logging.handlers import TimedRotatingFileHandler

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware

from back_api import (
    autofill_taxon,
    check_auth,
    del_record,
    edit_record,
    gen_stats,
    geo_search,
    get_localion,
    get_publ,
    get_record,
    get_records_file,
    info,
    logout,
    next_publ,
    pers_stats,
    publ_from_hash,
    records,
    refresh_token,
    suggest_taxon,
    support,
    user_image,
    users,
)
from back_api.rate_limiter import RateLimitExceeded, limiter, rate_limit_handler
from bot.bot_main import bot_start
from config.config import ALLOWED_ORIGINS, DEV_MODE, LOG_LEVEL, LOGS_DIR
from database.database import ping_db

logs_dir = LOGS_DIR
logs_dir.mkdir(exist_ok=True)

log_format = "%(asctime)s %(levelname)s [%(filename)s:%(lineno)d] %(message)s"

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

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.WARNING),
    handlers=[app_handler, error_handler],
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
    "httpx": logging.WARNING,
}

for lib_name, level in third_party_libs.items():
    logging.getLogger(lib_name).setLevel(level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger = logging.getLogger(__name__)

    bot_task = asyncio.create_task(bot_start())

    if not await ping_db():
        logger.critical("Database is not available. Application cannot start.")
        raise RuntimeError("Database connection failed")

    logger.info("Database connection verified")

    try:
        yield
    finally:
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

app.include_router(users.router, prefix="/api")
app.include_router(info.router, prefix="/api")
app.include_router(records.router, prefix="/api")
app.include_router(gen_stats.router, prefix="/api")
app.include_router(refresh_token.router, prefix="/api")
app.include_router(check_auth.router, prefix="/api")
app.include_router(logout.router, prefix="/api")
app.include_router(suggest_taxon.router, prefix="/api")
app.include_router(autofill_taxon.router, prefix="/api")
app.include_router(get_publ.router, prefix="/api")
app.include_router(support.router, prefix="/api")
app.include_router(pers_stats.router, prefix="/api")
app.include_router(user_image.router, prefix="/api")
app.include_router(get_localion.router, prefix="/api")
app.include_router(get_records_file.router, prefix="/api")
app.include_router(get_record.router, prefix="/api")
app.include_router(del_record.router, prefix="/api")
app.include_router(edit_record.router, prefix="/api")
app.include_router(next_publ.router, prefix="/api")
app.include_router(publ_from_hash.router, prefix="/api")
app.include_router(geo_search.router, prefix="/api")

if __name__ == "__main__":
    asyncio.run(bot_start())
