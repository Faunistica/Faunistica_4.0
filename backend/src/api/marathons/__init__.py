from fastapi import APIRouter, Depends

from api.marathons.marathons import router as marathon_router
from core.dependencies import get_jwt_user

router = APIRouter(
    prefix="/marathons", tags=["marathons"], dependencies=[Depends(get_jwt_user)]
)
router.include_router(marathon_router)