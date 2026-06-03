import logging
from typing import Annotated

from fastapi import APIRouter, Depends

from core.dependencies import TokenUser
from core.exceptions import UserNotFoundError
from schema.user import UserFull, UserUpdateMe
from service.user import UserService

router = APIRouter()

logger = logging.getLogger(__name__)


@router.get("/me")
async def get_current_user(
    token: TokenUser,
    user_service: Annotated[UserService, Depends()],
) -> UserFull:
    user = await user_service.get(token.user_id)
    if user is None:
        logger.warning("User not found during lookup: %d", token.user_id)
        raise UserNotFoundError(token.user_id)
    return UserFull.model_validate(user)


@router.put("/me")
async def update_current_user(
    data: UserUpdateMe,
    token: TokenUser,
    user_service: Annotated[UserService, Depends()],
) -> UserFull:
    user = await user_service.update_user_data(
        token.user_id,
        age=data.age,
        lng=data.language,
        comm=data.comm,
        sex=data.sex,
        rating=data.rating,
        email=data.email,
        region=data.region,
    )

    if user is None:
        logger.warning("User not found during update: %d", token.user_id)
        raise UserNotFoundError(token.user_id)

    return UserFull.model_validate(user)
