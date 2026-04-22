from fastapi import APIRouter, Request

from core.dependencies import TokenUser
from core.rate_limiter import limiter
from schemas.common import User

router = APIRouter()


@router.get("/me")
@limiter.limit("10/second")
async def me(
    request: Request,
    token: TokenUser,
) -> User:
    return User(user_id=token.user_id, username=token.username)
