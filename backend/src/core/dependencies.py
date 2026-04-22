from typing import Annotated, Any

import aiohttp
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from core.security import get_request_user
from schemas.common import User


def get_http_session(request: Request) -> aiohttp.ClientSession:
    return request.app.state.http_session


def get_location_data(request: Request) -> list[dict[str, Any]]:
    return request.app.state.location_data


type DBSession = Annotated[AsyncSession, Depends(get_session)]
type TokenUser = Annotated[User, Depends(get_request_user)]
type HTTPClient = Annotated[aiohttp.ClientSession, Depends(get_http_session)]
