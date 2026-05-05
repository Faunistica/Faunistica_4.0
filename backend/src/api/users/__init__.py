from fastapi import APIRouter, Depends

from core.security import get_jwt_user, validate_user_id_path

from . import lookup, me, photo, winner

user_id_router = APIRouter(
    prefix="/{user_id}", dependencies=[Depends(validate_user_id_path)]
)

user_id_router.include_router(photo.router, tags=["users"])

router = APIRouter(
    prefix="/users", tags=["users"], dependencies=[Depends(get_jwt_user)]
)

router.include_router(user_id_router)
router.include_router(me.router)
router.include_router(lookup.router)
router.include_router(winner.router)
