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
) -> None:
    update_data = data.model_dump(exclude_unset=True)  # 👈 ключ!
    if "username" in update_data:
        validate_result = await user_service.validate_username(
            update_data["username"], token.user_id
        )
        if isinstance(validate_result, MsgErr):
            raise UsernameAlreadyExistsError(validate_result.error)
    if "password" in update_data:
        update_data["hash"] = get_password_hash(update_data.pop("password"))
        update_data["hash_date"] = datetime.now()
    await user_service.update_user_data(token.user_id, **update_data)
    await session.commit()
