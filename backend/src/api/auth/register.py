import asyncio
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Query, Request

from core.config import settings
from core.dependencies import DBSession
from core.enums import PendingStatus
from core.exceptions import (
    RegistrationAlreadyStartedError,
    UsernameAlreadyExistsError,
)
from core.rate_limiter import limiter
from core.security import generate_code_for_registration, get_password_hash
from repository.registration import (
    create_pending_registration,
    get_pending_by_code,
    get_pending_by_username,
)
from repository.user import find_user_by_username
from schema.registration import (
    RegistrationStartRequest,
    RegistrationStartResponse,
    RegistrationStatusResponse,
)

router = APIRouter()


@router.post("/register")
@limiter.limit("3/minute")
async def start_registration(
    request: Request,
    data: RegistrationStartRequest,
    session: DBSession,
) -> RegistrationStartResponse:
    username = data.username
    password = data.password
    age = data.age
    language = data.language
    comm = data.comm
    existing_user = await find_user_by_username(session, username)
    if existing_user is not None:
        raise UsernameAlreadyExistsError(username)

    pending_for_username = await get_pending_by_username(session, username)
    if pending_for_username is not None:
        raise RegistrationAlreadyStartedError(username)
    code = await generate_code_for_registration()
    existing = await get_pending_by_code(session, code)
    if existing is None:
        password_hash = get_password_hash(password)
        await create_pending_registration(
            session,
            username=username,
            password_hash=password_hash,
            code=code,
            age=age,
            language=language,
            comm=comm,
        )
        await session.commit()

        return RegistrationStartResponse(
            code=code,
            expires_in=settings.REGISTRATION_EXPIRE_SECONDS,
        )
    raise HTTPException(
        status_code=500,
        detail="Failed to generate registration code",
    )


@router.get("/register/status")
@limiter.limit("30/minute")
async def registration_status(
    request: Request,
    session: DBSession,
    code: str = Query(min_length=4, max_length=20),
    timeout: int = Query(
        default=settings.REGISTRATION_POLL_TIMEOUT_SECONDS, ge=5, le=60
    ),
) -> RegistrationStatusResponse:
    deadline = datetime.now() + timedelta(seconds=timeout)

    for _ in range(timeout // settings.REGISTRATION_POLL_INTERVAL_SECONDS):
        pending = await get_pending_by_code(session, code)
        if pending is None:
            await session.rollback()
            return RegistrationStatusResponse(status=PendingStatus.NOT_FOUND)

        if pending.status == PendingStatus.CONFIRMED:
            return RegistrationStatusResponse(
                status=pending.status,
                username=pending.username,
                user_id=pending.telegram_id,
                confirmed_at=pending.confirmed_at,
            )

        if datetime.now() >= deadline:
            await session.rollback()
            return RegistrationStatusResponse(status=PendingStatus.PENDING)

        await session.rollback()
        await asyncio.sleep(settings.REGISTRATION_POLL_INTERVAL_SECONDS)
