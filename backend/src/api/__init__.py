from fastapi import APIRouter

from api import (
    auth,
    badges,
    geo,
    leaderboard,
    marathons,
    publications,
    records,
    statistics,
    support,
    taxonomy,
    users,
)
from api import map as map_api

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(taxonomy.router)
api_router.include_router(geo.router)
api_router.include_router(support.router)
api_router.include_router(records.router)
api_router.include_router(publications.router)
api_router.include_router(statistics.router)
api_router.include_router(badges.router)
api_router.include_router(leaderboard.router)
api_router.include_router(marathons.router)
api_router.include_router(map_api.router)