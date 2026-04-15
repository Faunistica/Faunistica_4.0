from fastapi import APIRouter

from api.stats import general

router = APIRouter(prefix="/stats", tags=["stats"])


router.include_router(general.router)
