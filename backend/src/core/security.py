import hashlib
import hmac
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Annotated

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, HTTPException, Request, Response, status
from jwt import DecodeError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_session
from core.exceptions import AdminOnlyError, InvalidTokenError
from repository.user import get_user
from schema.jwt import Token, TokenPayload
from schema.user import UserMinimal

logger = logging.getLogger(__name__)


pwd_hasher = PasswordHasher()


@dataclass
class PasswordCheckResult:
    is_valid: bool
    new_hash: str | None
    hash_type: str


def get_password_hash(user_pass: str) -> str:
    return pwd_hasher.hash(user_pass)


def check_password(password: str, db_hash: str) -> PasswordCheckResult:
    if db_hash.startswith("$argon2"):
        hash_type = "argon2"
        try:
            pwd_hasher.verify(db_hash, password)
            return PasswordCheckResult(True, None, hash_type)
        except VerifyMismatchError:
            return PasswordCheckResult(False, None, hash_type)
    elif len(db_hash) == 32 and db_hash.isalnum():
        hash_type = "md5"

        md5_hash = hashlib.md5(password.encode()).hexdigest()  # noqa: S324
        if hmac.compare_digest(md5_hash, db_hash):
            return PasswordCheckResult(True, pwd_hasher.hash(password), hash_type)
        return PasswordCheckResult(False, None, hash_type)

    logger.warning("Unrecognized password hash format: %s", db_hash[:10])
    raise ValueError("Unrecognized password hash format")


def set_response_token_cookies(response: Response, payload: TokenPayload) -> None:
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=not settings.DEV_MODE,
        samesite="strict",
        max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
        path="/api",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not settings.DEV_MODE,
        samesite="strict",
        max_age=settings.REFRESH_TOKEN_EXPIRE_SECONDS,
        path="/api",
    )


def create_access_token(payload: TokenPayload) -> str:
    expires = datetime.now(UTC) + timedelta(
        seconds=settings.ACCESS_TOKEN_EXPIRE_SECONDS
    )

    data = Token(
        **payload.model_dump(),
        type="access",
        exp=expires,
    )

    return jwt.encode(
        data.model_dump(), settings.JWT_SECRET.get_secret_value(), algorithm="HS256"
    )


def create_refresh_token(payload: TokenPayload) -> str:
    expires = datetime.now(UTC) + timedelta(
        seconds=settings.REFRESH_TOKEN_EXPIRE_SECONDS
    )

    data = Token(
        **payload.model_dump(),
        type="refresh",
        exp=expires,
    )

    return jwt.encode(
        data.model_dump(), settings.JWT_SECRET.get_secret_value(), algorithm="HS256"
    )


def verify_token(token: str) -> Token:
    try:
        return Token.model_validate(
            jwt.decode(
                token,
                settings.JWT_SECRET.get_secret_value(),
                algorithms=["HS256"],
            )
        )
    except jwt.ExpiredSignatureError as e:
        logger.warning("Token expired")
        raise InvalidTokenError("Token expired") from e
    except DecodeError as e:
        logger.warning("Invalid token: %s", e)
        raise InvalidTokenError from e
    except ValidationError as e:
        logger.warning("Invalid token: %s", e)
        raise InvalidTokenError from e


async def get_jwt_user(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> UserMinimal:
    token = request.cookies.get("access_token")
    if not token:
        logger.warning("Missing access token")
        raise InvalidTokenError("Missing access token")

    payload = verify_token(token)
    if payload.type != "access":
        logger.warning("Invalid token type")
        raise InvalidTokenError("Invalid token type")

    try:
        user_id = int(payload.sub)
    except ValueError as e:
        raise InvalidTokenError from e

    user = await get_user(session, user_id)
    if user is None or user.token_version != payload.version:
        logger.warning("Token version mismatch or user not found")
        raise InvalidTokenError("Invalid token")

    return UserMinimal(user_id=user_id, name=payload.username)


def check_admin(
    session: AsyncSession,
    user_id: int,
) -> bool:
    raise AdminOnlyError


def validate_user_id(user_id: int, token_id: int) -> int:
    if user_id != token_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    return user_id


def validate_user_id_path(
    user_id: int,
    token: Annotated[UserMinimal, Depends(get_jwt_user)],
) -> int:
    return validate_user_id(user_id, token.user_id)
