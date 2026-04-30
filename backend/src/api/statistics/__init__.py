from fastapi import APIRouter

from api.statistics.project import router as project_router
from api.statistics.users import router as users_router

router = APIRouter(prefix="/statistics", tags=["statistics"])
router.include_router(project_router)
router.include_router(users_router)
