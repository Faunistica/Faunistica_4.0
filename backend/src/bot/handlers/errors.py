import logging

from aiogram import Router
from aiogram.types import ErrorEvent

logger = logging.getLogger(__name__)


router = Router()


@router.error()
async def error_handler(event: ErrorEvent) -> None:
    logger.critical("Critical error caused by %s", event.exception, exc_info=True)
