from fastapi import APIRouter, Request

from api.dependencies import Token
from schemas.common import User

router = APIRouter()


@router.get("/me")
async def personal_stats(
    request: Request,
    token: Token,
) -> User:
    return User(user_id=token.user_id, username=token.username)
