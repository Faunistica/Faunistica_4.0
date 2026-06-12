from fastapi import APIRouter, Depends

from core.security import get_jwt_user

from . import lookup, me, photo, winner

router = APIRouter(
    prefix="/users", tags=["users"], dependencies=[Depends(get_jwt_user)]
)

router.include_router(photo.router)
router.include_router(me.router)
router.include_router(lookup.router)
router.include_router(winner.router)
