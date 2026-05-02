from typing import Annotated

import aiohttp
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from core.security import get_jwt_user
from schema.geo import RegionData
from schema.user import UserMinimal


def get_http_session(request: Request) -> aiohttp.ClientSession:
    return request.app.state.http_session


def get_location_data(request: Request) -> list[RegionData]:
    return request.app.state.location_data


def get_client_ip(request: Request) -> str | None:
    """Extract client IP, checking X-Forwarded-For header first."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


TokenUser = Annotated[UserMinimal, Depends(get_jwt_user)]
DBSession = Annotated[AsyncSession, Depends(get_session)]
HTTPClient = Annotated[aiohttp.ClientSession, Depends(get_http_session)]
LocationData = Annotated[list[RegionData], Depends(get_location_data)]
ClientIP = Annotated[str | None, Depends(get_client_ip)]
