from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends, HTTPException

from core.dependencies import DBSession
from core.enums import UserState
from core.exceptions import UserNotCreated, UserNotFoundError
from core.model import PendingRegistration, User
from core.security import generate_code_for_tg_enter
from repository.registration import (
    get_pending_by_code,
    get_pending_by_token,
    update_pending_by_token,
)
from repository.user import get_user
from schema.registration import RegistrationStartResponse, SurveyRequest
from service.user import UserService


def is_enter_expired(created_at: datetime, life_time: int) -> bool:
    # created_at comes from DB and can be naive (without tz). Treat naive values as UTC.
    created_at_utc = (
        created_at.replace(tzinfo=UTC)
        if created_at.tzinfo is None
        else created_at.astimezone(UTC)
    )
    current_time_utc = datetime.now(UTC)
    current_time_utc = (
        current_time_utc.replace(tzinfo=UTC)
        if current_time_utc.tzinfo is None
        else current_time_utc.astimezone(UTC)
    )
    return (current_time_utc - created_at_utc) > timedelta(seconds=life_time)


async def get_validated_pending_by_code(
    session: DBSession,
    code: str,
) -> tuple[PendingRegistration, int]:

    pending = await get_pending_by_code(session, code)
    if pending is None:
        raise HTTPException(status_code=404, detail="Pending by code not found")

    if pending.telegram_id is None:
        raise HTTPException(status_code=403, detail="Telegram id not found")

    return pending, pending.telegram_id


async def get_validated_pending_by_token(
    session: DBSession,
    token: str,
    code: str,
    *,
    populate_existing: bool = False,
) -> PendingRegistration:

    pending = await get_pending_by_token(
        session, token, populate_existing=populate_existing
    )
    if pending is None:
        raise HTTPException(status_code=404, detail="Pending by code not found")
    if pending.code != code:
        raise HTTPException(
            status_code=400,
            detail="Invalid code",
        )
    return pending


async def create_user_from_survey(
    data: SurveyRequest,
    items: str,
    password_hash: str,
    pending: PendingRegistration,
    id: int,
    user_service: Annotated[UserService, Depends()],
) -> User:
    current_user = await user_service.complete_full_registration(
        user_id=id,
        tlg_name=pending.telegram_name,
        tlg_username=pending.telegram_username,
        username=data.username,
        name=data.name,
        age=data.age,
        lng=data.lng,
        comm=data.comm,
        sex=data.sex,
        items=items,
        reg_stat=UserState.REG_COMPLETED,
        hash=password_hash,
        hash_date=datetime.now(UTC).replace(tzinfo=None),
        reg_run=pending.token_created_at.replace(tzinfo=None),
        reg_end=datetime.now(UTC).replace(tzinfo=None),
    )
    if current_user is None:
        raise UserNotCreated(id)
    return current_user


async def refresh_code(
    session: DBSession,
    token: str,
) -> RegistrationStartResponse:
    new_code = await generate_code_for_tg_enter()

    existing_by_code = await get_pending_by_code(session, new_code)
    if existing_by_code is not None:
        raise HTTPException(
            status_code=500, detail="Failed to generate registration code"
        )

    await update_pending_by_token(
        session,
        code=new_code,
        token=token,
        code_created_at=datetime.now(UTC).replace(tzinfo=None),
    )
    await session.commit()

    return RegistrationStartResponse(code=new_code)


async def get_validated_user(session: DBSession, user_id: int) -> User:
    user = await get_user(session, user_id)
    if user is None:
        raise UserNotFoundError(user_id)
    return user
