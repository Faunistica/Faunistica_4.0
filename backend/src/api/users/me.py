import logging
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends

from core.dependencies import DBSession, TokenUser
from core.exceptions import MsgErr, UsernameAlreadyExistsError, UserNotFoundError
from core.security import get_password_hash
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
    session: DBSession,
    user_service: Annotated[UserService, Depends()],
) -> UserFull:
    username = data.username
    password = data.password
    if username is not None:
        validate_username = await user_service.validate_username(
            username, token.user_id
        )
        if isinstance(validate_username, MsgErr):
            raise UsernameAlreadyExistsError(validate_username.error)
    if password is not None:
        hash = get_password_hash(password)
        hash_date = datetime.now()
    else:
        hash_date = await user_service.get(token.user_id).hash_date
    user = await user_service.update_user_data(
        token.user_id,
        username=username,
        hash=hash,
        hash_date=hash_date,
        name=data.name,
        age=data.age,
        lng=data.lng,
        comm=data.comm,
        sex=data.sex,
        rating=data.rating,
        email=data.email,
        region=data.region,
    )
    await session.commit()
    if user is None:
        logger.warning("User not found during update: %d", token.user_id)
        raise UserNotFoundError(token.user_id)

    return UserFull.model_validate(user)
