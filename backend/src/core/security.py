import logging
from datetime import UTC, datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, HTTPException, Request, status
from jose import ExpiredSignatureError, JWTError, jwt

from core.config import settings

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


def create_access_token(data: dict) -> str:
    expires = datetime.now(UTC) + timedelta(
        seconds=settings.ACCESS_TOKEN_EXPIRE_SECONDS
    )
    data.update({"exp": expires, "type": "access"})
    return jwt.encode(data, settings.JWT_SECRET.get_secret_value())


def create_refresh_token(data: dict) -> str:
    expires = datetime.now(UTC) + timedelta(
        seconds=settings.REFRESH_TOKEN_EXPIRE_SECONDS
    )
    data.update({"exp": expires, "type": "refresh"})
    return jwt.encode(data, settings.JWT_SECRET.get_secret_value())


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(
            token, settings.JWT_SECRET.get_secret_value(), algorithms=["HS256"]
        )
    except ExpiredSignatureError as e:
        logger.warning("Token expired")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Token expired"
        ) from e
    except JWTError as e:
        logger.warning("Invalid token")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token"
        ) from e


def get_token_payload(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        logger.warning("Missing access token")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Missing access token"
        )
    payload = verify_token(token)
    if payload.get("type") != "access":
        logger.warning("Invalid token type")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token type"
        )
    return payload


def get_current_user(
    request: Request,
) -> dict:
    return get_token_payload(request)


def validate_user_id(
    user_id: int,
    current_user: dict = Depends(get_current_user),  # noqa: B008
) -> None:
    if user_id != int(current_user["sub"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )
