from fastapi import APIRouter, Request

from core.dependencies import TokenUser
from core.rate_limiter import limiter
from schema.user import UserMinimal

router = APIRouter()


@router.get("/me")
@limiter.limit("10/second")
async def get_current_user(
    request: Request,
    token: TokenUser,
) -> UserMinimal:
    """
    Получение информации о текущем пользователе.

    Возвращает минимальные данные аутентифицированного пользователя.
    """
    return UserMinimal(user_id=token.user_id, username=token.username)
