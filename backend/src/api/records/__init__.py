from fastapi import APIRouter, Depends

from api.records import create, list, record
from core.dependencies import get_jwt_user

router = APIRouter(tags=["records"], dependencies=[Depends(get_jwt_user)])
router.include_router(list.router)
router.include_router(create.router)
router.include_router(record.router)
