from typing import Any, TypeVar

import aiohttp
from fastapi import Request

T = TypeVar("T")


def clean_value(value: T | None) -> T | None:
    if value in ("", None, [], 0, 0.0):
        return None
    return value


async def get_http_session(request: Request) -> aiohttp.ClientSession:
    return request.app.state.http_session


def get_location_data(request: Request) -> list[dict[str, Any]]:
    return request.app.state.location_data
