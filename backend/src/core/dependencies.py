from typing import Annotated

import aiohttp
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from core.security import get_jwt_user
from schemas.geo import RegionData
from schemas.user import UserMinimal


def get_http_session(request: Request) -> aiohttp.ClientSession:
    return request.app.state.http_session


def get_location_data(request: Request) -> list[RegionData]:
    return request.app.state.location_data


type DBSession = Annotated[AsyncSession, Depends(get_session)]
type TokenUser = Annotated[UserMinimal, Depends(get_jwt_user)]
type HTTPClient = Annotated[aiohttp.ClientSession, Depends(get_http_session)]
type LocationData = Annotated[list[RegionData], Depends(get_location_data)]
