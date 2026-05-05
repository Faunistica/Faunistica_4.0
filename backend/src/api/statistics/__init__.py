from fastapi import APIRouter, Depends

from api.statistics.project import router as project_router
from api.statistics.users import router as users_router
from core.dependencies import get_jwt_user

router = APIRouter(
    prefix="/statistics", tags=["statistics"], dependencies=[Depends(get_jwt_user)]
)
router.include_router(project_router)
router.include_router(users_router)
