import asyncio
import json
import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIASGIMiddleware

from api import api_router
from bot import bot
from core.config import settings
from core.exceptions import (
    APIException,
    DBException,
    api_exception_handler,
    db_exception_handler,
)
from core.health import router as health_router
from core.lifespan import lifespan
from core.logging import setup_logging
from core.rate_limiter import limiter, rate_limit_handler

setup_logging()

logger = logging.getLogger(__name__)

_build_info_path = Path(__file__).resolve().parent.parent / "build_info.json"
if _build_info_path.exists():
    try:
        _info = json.loads(_build_info_path.read_text())
        logger.info(
            "Build: commit=%s tag=%s branch=%s",
            _info.get("commit"),
            _info.get("tag"),
            _info.get("branch"),
        )
    except (json.JSONDecodeError, OSError):
        pass

app = FastAPI(lifespan=lifespan)
app.include_router(health_router)

logger.info("Running in %s mode", "DEVELOPMENT" if settings.DEV_MODE else "PRODUCTION")
logger.info("Allowed origins: %s", settings.ALLOWED_ORIGINS)

app.state.limiter = limiter
app.add_middleware(SlowAPIASGIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["set-cookie", "Content-Disposition"],
)


app.add_exception_handler(DBException, db_exception_handler)
app.add_exception_handler(APIException, api_exception_handler)
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

app.include_router(api_router)

if __name__ == "__main__":
    asyncio.run(bot.start())
