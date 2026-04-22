from fastapi import APIRouter, Depends

from core.security import validate_user_id_path

from . import create, delete, get, list, update

router = APIRouter(
    prefix="/record",
    tags=["records"],
    dependencies=[Depends(validate_user_id_path)],
)

router.include_router(create.router)
router.include_router(list.router)
router.include_router(get.router)
router.include_router(update.router)
router.include_router(delete.router)
