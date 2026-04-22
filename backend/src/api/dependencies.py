from typing import Annotated, Any, Literal

import aiohttp
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from core.security import get_request_user
from schemas.jwt import TokenPayload


def get_http_session(request: Request) -> aiohttp.ClientSession:
    return request.app.state.http_session


def get_location_data(request: Request) -> list[dict[str, Any]]:
    return request.app.state.location_data


type Token = Annotated[TokenPayload, Depends(get_request_user)]


def validate_user_id_path(
    user_id: int | Literal["me"],
    token: Token,
) -> None:
    if user_id == "me":
        return

    if user_id != token.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )


type DBSession = Annotated[AsyncSession, Depends(get_session)]
type HTTPClient = Annotated[aiohttp.ClientSession, Depends(get_http_session)]
