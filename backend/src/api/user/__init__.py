from fastapi import APIRouter

from api.user import me, photo, publication

router = APIRouter(prefix="/user", tags=["users"])

router.include_router(me.router)
router.include_router(photo.router)
router.include_router(publication.router)
