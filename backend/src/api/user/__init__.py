from fastapi import APIRouter, Depends

from api.user import me, photo, publication, record
from core.security import validate_user_id_path

user_id_router = APIRouter(
    prefix="/{user_id}", dependencies=[Depends(validate_user_id_path)]
)

user_id_router.include_router(publication.router)
user_id_router.include_router(record.router)
user_id_router.include_router(photo.router, tags=["users"])

router = APIRouter(prefix="/user", tags=["users"])

router.include_router(user_id_router)
router.include_router(me.router)
