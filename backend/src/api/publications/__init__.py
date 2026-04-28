from fastapi import APIRouter

from api.publications import list

router = APIRouter(tags=["publications"])
router.include_router(list.router)
