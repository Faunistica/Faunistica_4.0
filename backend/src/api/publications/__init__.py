from fastapi import APIRouter

from api.publications import current

router = APIRouter(tags=["publications"])
router.include_router(current.router)
