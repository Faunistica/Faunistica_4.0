import logging
from datetime import UTC, datetime, timedelta
from typing import Annotated

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, HTTPException, Request, status
from jose import ExpiredSignatureError, JWTError, jwt
from pydantic import ValidationError

from core.config import settings
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


def create_access_token(payload: TokenPayload) -> str:
    expires = datetime.now(UTC) + timedelta(
        seconds=settings.ACCESS_TOKEN_EXPIRE_SECONDS
    )

    data = {
        "sub": str(payload.user_id),
        "username": payload.username,
        "exp": expires,
        "type": "access",
    }

    return jwt.encode(data, settings.JWT_SECRET.get_secret_value())


def create_refresh_token(payload: TokenPayload) -> str:
    expires = datetime.now(UTC) + timedelta(
        seconds=settings.REFRESH_TOKEN_EXPIRE_SECONDS
    )

    data = {
        "sub": str(payload.user_id),
        "username": payload.username,
        "exp": expires,
        "type": "refresh",
    }

    return jwt.encode(data, settings.JWT_SECRET.get_secret_value())


# FIXME: token blacklist
def verify_token(token: str) -> Token:
    try:
        return Token.model_validate(
            jwt.decode(token, settings.JWT_SECRET.get_secret_value())
        )
    except ExpiredSignatureError as e:
        logger.warning("Token expired")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Token expired"
        ) from e
    except JWTError as e:
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
) -> TokenPayload:
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

    return payload


def validate_user_id(
    user_id: int,
    token: Annotated[TokenPayload, Depends(get_request_user)],
) -> None:
    if user_id != token.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )
