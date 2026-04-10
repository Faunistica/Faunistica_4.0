from fastapi import APIRouter

from api.geo import reverse_geocode, search

router = APIRouter(prefix="/geo", tags=["geo"])


router.include_router(search.router)
router.include_router(reverse_geocode.router)
