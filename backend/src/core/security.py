import logging
from datetime import UTC, datetime, timedelta
from typing import Annotated, Literal

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, HTTPException, Request, Response, status
from jwt import DecodeError
from pydantic import ValidationError

from core.config import settings
from schemas.common import User
from schemas.jwt import Token, TokenPayload

logger = logging.getLogger(__name__)


pwd_hasher = PasswordHasher()


def get_password_hash(user_pass: str) -> str:
    return pwd_hasher.hash(user_pass)


def check_password_hash(user_pass: str, db_hash: str) -> bool:
    try:
        pwd_hasher.verify(db_hash, user_pass)
    except VerifyMismatchError:
        return False
    return True


def set_response_token_cookies(response: Response, payload: TokenPayload) -> None:
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
        path="/api",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.REFRESH_TOKEN_EXPIRE_SECONDS,
        path="/api",
    )


def create_access_token(payload: TokenPayload) -> str:
    expires = datetime.now(UTC) + timedelta(
        seconds=settings.ACCESS_TOKEN_EXPIRE_SECONDS
    )

    data = Token(
        sub=payload.sub,
        username=payload.username,
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
        sub=payload.sub,
        username=payload.username,
        type="refresh",
        exp=expires,
    )

    return jwt.encode(
        data.model_dump(), settings.JWT_SECRET.get_secret_value(), algorithm="HS256"
    )


# FIXME: token blacklist
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Token expired"
        ) from e
    except DecodeError as e:
        logger.warning("Invalid token %e", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token"
        ) from e
    except ValidationError as e:
        logger.warning("Invalid token %e", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token"
        ) from e


def get_request_user(
    request: Request,
) -> User:
    token = request.cookies.get("access_token")
    if not token:
        logger.warning("Missing access token")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Missing access token"
        )

    payload = verify_token(token)
    if payload.type != "access":
        logger.warning("Invalid token type")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token type"
        )

    return User(user_id=int(payload.sub), username=payload.username)


def validate_user_id_path(
    user_id: int | Literal["me"],
    token: Annotated[TokenPayload, Depends(get_request_user)],
) -> None:
    if user_id == "me":
        return

    if user_id != token.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )
