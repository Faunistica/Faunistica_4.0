from fastapi import APIRouter

from api import (
    auth,
    geo,
    records,
    stats,
    support,
    taxonomy,
    users,
)

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(records.router)
api_router.include_router(taxonomy.router)
api_router.include_router(geo.router)
api_router.include_router(stats.router)
api_router.include_router(support.router)
