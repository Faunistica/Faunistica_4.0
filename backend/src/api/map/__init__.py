from fastapi import APIRouter, Depends

from api.map.map import router as map_router
from core.dependencies import get_jwt_user

router = APIRouter(
    prefix="/map", tags=["map"], dependencies=[Depends(get_jwt_user)]
)
router.include_router(map_router)