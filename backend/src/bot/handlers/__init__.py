from aiogram import Router

from bot.handlers.admin import router as admin_router
from bot.handlers.auth import router as auth_router
from bot.handlers.errors import router as errors_router
from bot.handlers.fallback import router as fallback_router
from bot.handlers.menu import router as menu_router
from bot.handlers.registration import router as registration_router
from bot.handlers.rename import router as rename_router
from bot.handlers.sociology import router as sociology_router
from bot.handlers.start import router as start_router
from bot.handlers.stats import router as stats_router
from bot.handlers.support import router as support_router

main_router = Router()
main_router.include_router(admin_router)
main_router.include_router(auth_router)
main_router.include_router(errors_router)
main_router.include_router(menu_router)
main_router.include_router(registration_router)
main_router.include_router(rename_router)
main_router.include_router(sociology_router)
main_router.include_router(start_router)
main_router.include_router(stats_router)
main_router.include_router(support_router)
main_router.include_router(fallback_router)
