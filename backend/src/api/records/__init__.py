from fastapi import APIRouter

from api.records import create, list, record

router = APIRouter(tags=["records"])
router.include_router(list.router)
router.include_router(create.router)
router.include_router(record.router)
