import aiohttp
from fastapi import Request


async def get_http_session(request: Request) -> aiohttp.ClientSession:
    return request.app.state.http_session
