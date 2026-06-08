from fastapi import APIRouter, Depends

from api.leaderboard.leaderboard import router as lb_router
from core.dependencies import get_jwt_user

router = APIRouter(
    prefix="/leaderboard", tags=["leaderboard"], dependencies=[Depends(get_jwt_user)]
)
router.include_router(lb_router)