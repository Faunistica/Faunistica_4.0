from fastapi import APIRouter

from api.publications import complete, current

router = APIRouter(tags=["publications"])
router.include_router(current.router)
router.include_router(complete.router)
