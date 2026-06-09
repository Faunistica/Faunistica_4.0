import asyncio
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response

from core.config import settings
from core.dependencies import ClientIP, DBSession
from core.enums import PendingStatus
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
from schema.jwt import TokenPayload
from schema.registration import (
    RegistrationStartResponse,
    RegistrationStatusResponse,
    SurveyRequest,
)
from service.actions import ActionService
from service.publications import PublicationService
from service.registration import (
    create_user_from_survey,
    get_validated_pending_by_code,
    get_validated_pending_by_token,
    get_validated_user,
    is_enter_expired,
    refresh_code,
)
from service.user import UserService

router = APIRouter()


@router.get("/bot-url")
async def get_bot_url() -> dict:
    """Возвращает ссылку на бота: https://t.me/{BOT_USERNAME}"""
    if settings.BOT_USERNAME is None:
        raise HTTPException(status_code=503, detail="Bot is not initialized yet")
    return {"bot_url": f"https://t.me/{settings.BOT_USERNAME}"}


@router.post("/code")
@limiter.limit("3/minute")
async def create_code(
    request: Request,
    session: DBSession,
) -> RegistrationStartResponse | None:
    code = await generate_code_for_tg_enter()
    token = await generate_token_for_tg_enter()
    existing_by_code = await get_pending_by_code(session, code)
    if existing_by_code and is_enter_expired(
        existing_by_code.token_created_at, settings.TG_TOKEN_EXPIRE_SECONDS
    ):
        existing_by_code = None
    existing_by_token = await get_pending_by_token(session, token)
    if existing_by_token and is_enter_expired(
        existing_by_token.token_created_at, settings.TG_TOKEN_EXPIRE_SECONDS
    ):
        existing_by_token = None
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


@router.post("/survey")
@limiter.limit("3/minute")
async def survey_filling(
    request: Request,
    data: SurveyRequest,
    response: Response,
    session: DBSession,
    ip: ClientIP,
    action_service: Annotated[ActionService, Depends()],
    user_service: Annotated[UserService, Depends()],
) -> RegistrationStatusResponse | None:
    await user_service.check_username_unique(data.username)
    pending, user_id = await get_validated_pending_by_code(session, data.code)
    password_hash = get_password_hash(data.password)
    items = PublicationService.generate_started_publications(data.lng)
    current_user = await create_user_from_survey(
        data, items, password_hash, pending, user_id, user_service
    )
    await create_auth_response(response, ip, current_user, action_service)
    await update_pending_by_token(
        session,
        data.token,
        status=PendingStatus.COMPLETED,
        confirmed_at=datetime.now(UTC).replace(tzinfo=None),
    )
    await session.commit()
    return RegistrationStatusResponse(
        status=PendingStatus.COMPLETED,
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

    deadline = datetime.now(UTC).replace(tzinfo=None) + timedelta(seconds=time_out)

    for _ in range(time_out * 2 // settings.TG_AUTH_POLL_INTERVAL_SECONDS):
        pending = await get_validated_pending_by_token(session, token, code, populate_existing=True)
        if is_enter_expired(pending.code_created_at, settings.TG_CODE_EXPIRE_SECONDS):
            return await refresh_code(session, token)

        if (
            pending.status == PendingStatus.AWAITING_API_LOGIN
            and pending.telegram_id is not None
        ):
            current_user = await get_validated_user(session, pending.telegram_id)
            await create_auth_response(response, ip, current_user, action_service)
            await update_pending_by_token(
                session,
                token,
                status=PendingStatus.COMPLETED,
                confirmed_at=datetime.now(UTC).replace(tzinfo=None),
            )
            await session.commit()
            return RegistrationStatusResponse(
                status=PendingStatus.AWAITING_API_LOGIN,
                user_id=current_user.user_id,
                name=current_user.name,
                username=current_user.username,
            )
        if pending.status == PendingStatus.AWAITING_API_REGISTRATION:
            return RegistrationStatusResponse(
                status=pending.status,
            )
        if datetime.now(UTC).replace(tzinfo=None) >= deadline:
            await session.rollback()
            return RegistrationStatusResponse(status=PendingStatus.AWAITING_CODE)
        try:
            await asyncio.sleep(settings.TG_AUTH_POLL_INTERVAL_SECONDS)
        except asyncio.CancelledError:
            return None
    return None


async def create_auth_response(
    response: Response,
    ip: ClientIP,
    current_user: User,
    action_service: ActionService,
) -> TokenPayload:
    if current_user.name is None:
        raise HTTPException(status_code=403, detail="Name is null")

    token_payload = TokenPayload(
        sub=str(current_user.user_id),
        username=current_user.name,
        version=current_user.token_version,
    )

    set_response_token_cookies(response, token_payload)
    await action_service.log_login(current_user.user_id, ip)

    return token_payload
