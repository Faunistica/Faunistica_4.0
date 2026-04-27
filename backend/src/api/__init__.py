from fastapi import APIRouter

from api import (
    auth,
    geo,
    publications,
    records,
    support,
    taxonomy,
    user,
)

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(user.router)
api_router.include_router(taxonomy.router)
api_router.include_router(geo.router)
api_router.include_router(support.router)
api_router.include_router(records.router)
api_router.include_router(publications.router)
