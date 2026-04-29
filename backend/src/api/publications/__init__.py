from fastapi import APIRouter

from api.publications import current, list

router = APIRouter(prefix="/publications", tags=["publications"])
router.include_router(current.router)
router.include_router(list.router)
