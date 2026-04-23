from fastapi import APIRouter, Request

from core.dependencies import TokenUser
from core.rate_limiter import limiter
from schemas.user import UserMinimal

router = APIRouter()


@router.get("/me")
@limiter.limit("10/second")
async def get_current_user(
    request: Request,
    token: TokenUser,
) -> UserMinimal:
    return UserMinimal(user_id=token.user_id, username=token.username)
