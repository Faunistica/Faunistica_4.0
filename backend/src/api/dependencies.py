from typing import Any

import aiohttp
from fastapi import Request


async def get_http_session(request: Request) -> aiohttp.ClientSession:
    return request.app.state.http_session


def get_location_data(request: Request) -> list[dict[str, Any]]:
    return request.app.state.location_data
