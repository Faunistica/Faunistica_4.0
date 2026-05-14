from fastapi import APIRouter, Depends

from api.taxonomy import autofill, suggest
from core.dependencies import get_jwt_user

router = APIRouter(
    prefix="/taxonomy", tags=["taxonomy"], dependencies=[Depends(get_jwt_user)]
)

router.include_router(suggest.router)
router.include_router(autofill.router)
