from fastapi import APIRouter

from api.record import create, delete, get, list, update

router = APIRouter(prefix="/user/{user_id}/record", tags=["records"])

router.include_router(create.router)
router.include_router(list.router)
router.include_router(get.router)
router.include_router(update.router)
router.include_router(delete.router)
