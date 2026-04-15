from fastapi import APIRouter

from api.users import me, photo, publication

router = APIRouter(prefix="/users", tags=["users"])

router.include_router(me.router)
router.include_router(photo.router)
router.include_router(publication.router)
