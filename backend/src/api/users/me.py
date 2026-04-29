import logging

from fastapi import APIRouter, HTTPException, Request, status

from core.dependencies import DBSession, TokenUser
from core.rate_limiter import limiter
from repository import user as repo
from schema.user import UserFull, UserMinimal, UserUpdate, UserUpdateMe

router = APIRouter()

logger = logging.getLogger(__name__)


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
    return UserMinimal(user_id=token.user_id, name=token.name)


@router.put("/me")
async def update_current_user(
    data: UserUpdateMe,
    token: TokenUser,
    session: DBSession,
) -> UserFull:
    update_data = UserUpdate(lng=data.lng, email=data.email)
    user = await repo.update_user(session, token.user_id, update_data)

    if user is None:
        logger.error("User not found during update: %d", token.user_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserFull.model_validate(user.__dict__)
