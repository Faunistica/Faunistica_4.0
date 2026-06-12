from fastapi import APIRouter, Depends

from api.publications import current, submit
from core.dependencies import get_jwt_user

router = APIRouter(tags=["publications"], dependencies=[Depends(get_jwt_user)])
router.include_router(current.router)
router.include_router(submit.router)
