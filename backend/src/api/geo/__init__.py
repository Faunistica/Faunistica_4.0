from fastapi import APIRouter, Depends

from api.geo import reverse_geocode, search
from core.dependencies import get_jwt_user

router = APIRouter(prefix="/geo", tags=["geo"], dependencies=[Depends(get_jwt_user)])


router.include_router(search.router)
router.include_router(reverse_geocode.router)
