import logging
from typing import Annotated

from fastapi import APIRouter, Depends

from core.security import get_jwt_user
from schema.common import UserInfo
from schema.user import UserMinimal

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/check")
async def check(
    user: Annotated[UserMinimal, Depends(get_jwt_user)],
) -> UserInfo:
    """
    Проверка валидности токена.

    Возвращает информацию о пользователе, если токен валиден.
    """
    return UserInfo(user_id=user.user_id, username=user.name)
