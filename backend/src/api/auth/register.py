import asyncio
import re
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Query

from core.dependencies import DBSession
from core.security import get_password_hash
from repository.registration import (
    create_pending_registration,
    get_pending_by_code,
    get_pending_by_username,
    update_pending_by_code,
)
from repository.user import find_user_by_username
from schema.registration import (
    RegistrationStartRequest,
    RegistrationStartResponse,
    RegistrationStatusResponse,
)
from service.registration import (
    REGISTRATION_EXPIRE_SECONDS,
    REGISTRATION_POLL_INTERVAL_SECONDS,
    REGISTRATION_POLL_TIMEOUT_SECONDS,
    is_registration_expired,
)

router = APIRouter()

_USERNAME_PATTERN = re.compile(r"^[а-яА-ЯёЁa-zA-Z0-9\s\-'.]+$")


async def _generate_unique_code(session: DBSession) -> str:
    for _ in range(10):
        code = secrets.token_hex(3).upper()
        existing = await get_pending_by_code(session, code)
        if existing is None:
            return code
    raise HTTPException(
        status_code=500,
        detail="Failed to generate registration code",
    )


@router.post("/register")
async def start_registration(
    data: RegistrationStartRequest,
    session: DBSession,
) -> RegistrationStartResponse:
    username = data.username.strip()
    password = data.password

    if len(username) < 3 or len(username) > 40:
        raise HTTPException(status_code=400, detail="Invalid username length")
    if not _USERNAME_PATTERN.fullmatch(username):
        raise HTTPException(status_code=400, detail="Invalid username")

    existing_user = await find_user_by_username(session, username)
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="Username already exists")

    pending_for_username = await get_pending_by_username(session, username)
    if pending_for_username is not None:
        if pending_for_username.status == "pending" and is_registration_expired(
            pending_for_username.created_at
        ):
            await update_pending_by_code(
                session,
                pending_for_username.code,
                status="expired",
            )
            await session.commit()
        else:
            raise HTTPException(status_code=409, detail="Registration already started")

    code = await _generate_unique_code(session)
    password_hash = get_password_hash(password)
    await create_pending_registration(
        session, username=username, password_hash=password_hash, code=code
    )
    await session.commit()

    return RegistrationStartResponse(
        code=code,
        expires_in=REGISTRATION_EXPIRE_SECONDS,
    )


@router.get("/register/status")
async def registration_status(
    session: DBSession,
    code: str = Query(min_length=4, max_length=20),
    timeout: int = Query(
        default=REGISTRATION_POLL_TIMEOUT_SECONDS, ge=5, le=60
    ),
) -> RegistrationStatusResponse:
    deadline = datetime.now() + timedelta(seconds=timeout)

    while True:
        pending = await get_pending_by_code(session, code)
        if pending is None:
            raise HTTPException(status_code=404, detail="Registration not found")

        if pending.status == "pending" and is_registration_expired(pending.created_at):
            pending = await update_pending_by_code(
                session,
                code,
                status="expired",
            )
            await session.commit()

        if pending.status != "pending":
            return RegistrationStatusResponse(
                status=pending.status,
                username=pending.username,
                user_id=pending.telegram_id,
                confirmed_at=pending.confirmed_at,
            )

        if datetime.now() >= deadline:
            await session.rollback()
            return RegistrationStatusResponse(status="pending")

        await session.rollback()
        await asyncio.sleep(REGISTRATION_POLL_INTERVAL_SECONDS)
