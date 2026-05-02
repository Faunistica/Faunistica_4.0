import logging
from logging.handlers import TimedRotatingFileHandler

from core.config import settings


def setup_logging() -> None:
    log_format = settings.LOG_FORMAT

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
