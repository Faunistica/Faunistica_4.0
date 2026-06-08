from fastapi import APIRouter, Depends

from api.badges.badges import router as badges_router
from core.dependencies import get_jwt_user

router = APIRouter(
    prefix="/badges", tags=["badges"], dependencies=[Depends(get_jwt_user)]
)
router.include_router(badges_router)