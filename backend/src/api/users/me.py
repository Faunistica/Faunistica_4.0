import logging

from fastapi import APIRouter, HTTPException, status

from core.dependencies import DBSession, TokenUser
from schema.user import UserFull, UserMinimal, UserUpdateMe
from service.user import UserService

router = APIRouter()

logger = logging.getLogger(__name__)


@router.get("/me")
async def get_current_user(
    token: TokenUser,
) -> UserMinimal:
    return UserMinimal(user_id=token.user_id, name=token.name)


@router.put("/me")
async def update_current_user(
    data: UserUpdateMe,
    token: TokenUser,
    session: DBSession,
) -> UserFull:
    user_service = UserService(session)
    user = await user_service.update_user_data(
        token.user_id, lng=data.lng, email=data.email
    )

    if user is None:
        logger.warning("User not found during update: %d", token.user_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserFull.model_validate(user)
