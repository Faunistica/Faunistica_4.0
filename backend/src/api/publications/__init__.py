from fastapi import APIRouter, Depends

from api.publications import comments, complete, current, metadata
from core.dependencies import get_jwt_user

router = APIRouter(tags=["publications"], dependencies=[Depends(get_jwt_user)])
router.include_router(current.router)
router.include_router(complete.router)
router.include_router(metadata.router)
router.include_router(comments.router)
