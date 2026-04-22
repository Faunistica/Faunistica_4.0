from fastapi import APIRouter

from api.user import me, photo, publication, record

# NOTE: yep, looks strange.
# How can I otherwise fix tags? idk

router = APIRouter()

user_id_router = APIRouter(prefix="/user/{user_id}")
user_router = APIRouter(prefix="/user", tags=["users"])

user_id_router.include_router(publication.router)
user_id_router.include_router(record.router)
user_router.include_router(me.router)
user_router.include_router(photo.router)

router.include_router(user_id_router)
router.include_router(user_router)
