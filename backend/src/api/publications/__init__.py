from fastapi import APIRouter

from api.publications import comments, complete, current, metadata

router = APIRouter(tags=["publications"])
router.include_router(current.router)
router.include_router(complete.router)
router.include_router(metadata.router)
router.include_router(comments.router)
