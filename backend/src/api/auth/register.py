import asyncio
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response

from core.config import settings
from core.dependencies import ClientIP, DBSession
from core.enums import PendingStatus, UserState
from core.exceptions import (
    MsgErr,
    UsernameAlreadyExistsError,
)
from core.model import User
from core.rate_limiter import limiter
from core.security import (
    generate_code_for_tg_enter,
    generate_token_for_tg_enter,
    get_password_hash,
    set_response_token_cookies,
)
from repository.registration import (
    create_pending_registration,
    get_pending_by_code,
    get_pending_by_token,
    update_pending_by_token,
)
from repository.user import find_user_by_username, get_user
from schema.jwt import TokenPayload
from schema.registration import (
    FormRequest,
    RegistrationStartResponse,
    RegistrationStatusResponse,
)
from service.actions import ActionService
from service.registration import is_enter_expired
from service.user import UserService

router = APIRouter()


@router.post("/code")
@limiter.limit("3/minute")
async def create_code(
    request: Request,
    session: DBSession,
) -> RegistrationStartResponse | None:
    code = await generate_code_for_tg_enter()
    token = await generate_token_for_tg_enter()
    existing_by_code = await get_pending_by_code(session, code)
    existing_by_token = await get_pending_by_token(session, token)
    if existing_by_code is not None or existing_by_token is not None:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate registration code or token",
        )
    await create_pending_registration(
        session,
        code=code,
        token=token,
    )
    await session.commit()
    return RegistrationStartResponse(
        code=code,
        code_expires_in=settings.TG_CODE_EXPIRE_SECONDS,
        token=token,
        token_expires_in=settings.TG_TOKEN_EXPIRE_SECONDS,
        bot_url=f"https://t.me/{settings.BOT_USERNAME}",
    )


@router.post("/form")
@limiter.limit("3/minute")
async def form_filling(
    request: Request,
    data: FormRequest,
    response: Response,
    session: DBSession,
    ip: ClientIP,
    action_service: Annotated[ActionService, Depends()],
) -> RegistrationStatusResponse | None:
    username = data.username
    name = data.name
    password = data.password
    sex = data.sex
    age = data.age
    lng = data.lng
    comm = data.comm
    code = data.code
    token = data.token
    validate_name = UserService.validate_name(name)
    validate_sex = UserService.validate_sex(sex)
    validate_age = UserService.validate_age_str(str(age))
    for validate_item in [validate_name, validate_sex, validate_age]:
        if isinstance(validate_item, MsgErr):
            raise HTTPException(status_code=400, detail=validate_item.error)
    existing_user = await find_user_by_username(session, username)
    if existing_user is not None:
        raise UsernameAlreadyExistsError(username)
    pending = await get_pending_by_code(session, code)
    if pending is None:
        raise HTTPException(status_code=404, detail="pending by code not found")
    password_hash = get_password_hash(password)
    session.add(
        User(
            user_id=pending.telegram_id,
            tlg_name=pending.telegram_name,
            tlg_username=pending.telegram_username,
            username=username,
            name=name,
            age=age,
            lng=lng,
            comm=comm,
            sex=sex,
            reg_stat=UserState.REG_COMPLETED,
            hash=password_hash,
            hash_date=datetime.now(),
            reg_run=pending.token_created_at,
            reg_end=datetime.now(),
        )
    )
    await session.commit()
    current_user = await get_user(session, pending.telegram_id)
    token_payload = TokenPayload(
        sub=str(current_user.user_id),
        username=current_user.name,
        version=current_user.token_version,
    )
    set_response_token_cookies(response, token_payload)

    await action_service.log_login(current_user.user_id, ip)
    await update_pending_by_token(
        session, token, status=PendingStatus.CONFIRMED, confirmed_at=datetime.now()
    )
    await session.commit()
    return RegistrationStatusResponse(
        status=PendingStatus.CONFIRMED,
    )


@router.get("/code/status")
@limiter.limit("3/minute")
async def registration_status(
    request: Request,
    session: DBSession,
    response: Response,
    code: Annotated[str, Query(min_length=4, max_length=20)],
    token: Annotated[str, Query(min_length=20, max_length=50)],
    ip: ClientIP,
    action_service: Annotated[ActionService, Depends()],
    time_out: Annotated[
        int, Query(ge=5, le=60)
    ] = settings.TG_AUTH_POLL_TIMEOUT_SECONDS,
) -> RegistrationStatusResponse | RegistrationStartResponse | None:

    deadline = datetime.now() + timedelta(seconds=time_out)

    for _ in range(time_out * 2 // settings.TG_AUTH_POLL_INTERVAL_SECONDS):
        pending = await get_pending_by_token(session, token)
        if pending is None:
            raise HTTPException(
                status_code=403,
                detail="Forbidden",
            )
        if pending.code != code:
            raise HTTPException(
                status_code=400,
                detail="Invalid code",
            )
        if is_enter_expired(pending.code_created_at, settings.TG_CODE_EXPIRE_SECONDS):
            code = await generate_code_for_tg_enter()
            existing_by_code = await get_pending_by_code(session, code)
            if existing_by_code is not None:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to generate registration code",
                )
            await update_pending_by_token(
                session,
                code=code,
                token=token,
                code_created_at=datetime.now(),
            )
            await session.commit()
            return RegistrationStartResponse(
                code=code,
            )

        if pending.status == PendingStatus.AUTH:
            current_user = await get_user(session, pending.telegram_id)
            token_payload = TokenPayload(
                sub=str(current_user.user_id),
                username=current_user.name,
                version=current_user.token_version,
            )
            set_response_token_cookies(response, token_payload)

            await action_service.log_login(current_user.user_id, ip)

            return RegistrationStatusResponse(
                status=pending.status,
                user_id=current_user.user_id,
                username=current_user.username,
            )
        if pending.status == PendingStatus.REGISTRATION:
            return RegistrationStatusResponse(
                status=pending.status,
            )
        if datetime.now() >= deadline:
            await session.rollback()
            return RegistrationStatusResponse(status=PendingStatus.CODE_PROCESSING)

        await session.rollback()
        await asyncio.sleep(settings.TG_AUTH_POLL_INTERVAL_SECONDS)
    return None
