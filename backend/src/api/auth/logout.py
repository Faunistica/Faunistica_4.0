from fastapi import APIRouter, Request, Response

from core.rate_limiter import limiter
from schema.common import Message

router = APIRouter()


# FIXME: token blacklist
@router.post("/logout")
@limiter.limit("1/minute")
async def logout(request: Request, response: Response) -> Message:
    """
    Выход пользователя.

    Очищает куки JWT токенов доступа и обновления.
    """
    response.delete_cookie(key="access_token", path="/api")
    response.delete_cookie(key="refresh_token", path="/api")

    return Message(message="Successfully logged out")
