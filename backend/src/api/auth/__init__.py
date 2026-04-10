from fastapi import APIRouter

from api.auth import check, login, logout, refresh

router = APIRouter(prefix="/auth", tags=["auth"])

router.include_router(check.router)
router.include_router(login.router)
router.include_router(logout.router)
router.include_router(refresh.router)
