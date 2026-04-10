from fastapi import APIRouter

from api.taxonomy import autofill, suggest

router = APIRouter(prefix="/taxonomy", tags=["taxonomy"])

router.include_router(suggest.router)
router.include_router(autofill.router)
