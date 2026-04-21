from fastapi import APIRouter, Depends

from api.record import create, delete, get, list, update
from core.security import validate_user_id

router = APIRouter(
    prefix="/user/{user_id}/record",
    tags=["records"],
    dependencies=[Depends(validate_user_id)],
)

router.include_router(create.router)
router.include_router(list.router)
router.include_router(get.router)
router.include_router(update.router)
router.include_router(delete.router)
