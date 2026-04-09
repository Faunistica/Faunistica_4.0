import logging
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from jose import ExpiredSignatureError, JWTError, jwt

from config.config import (
    ACCESS_TOKEN_EXPIRE,
    JWT_SECRET,
    REFRESH_TOKEN_EXPIRE,
)

logger = logging.getLogger(__name__)


class TokenService:
    def create_access_token(self, data: dict) -> str:
        expires = datetime.now(UTC) + timedelta(seconds=ACCESS_TOKEN_EXPIRE)
        data.update({"exp": expires, "type": "access"})
        return jwt.encode(data, JWT_SECRET)

    def create_refresh_token(self, data: dict) -> str:
        expires = datetime.now(UTC) + timedelta(seconds=REFRESH_TOKEN_EXPIRE)
        data.update({"exp": expires, "type": "refresh"})
        return jwt.encode(data, JWT_SECRET)

    def verify_token(self, token: str) -> dict:
        try:
            return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
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

    def get_current_user(self, request: Request) -> dict:
        token = request.cookies.get("access_token")
        if not token:
            logger.warning("Missing access token")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Missing access token"
            )
        payload = self.verify_token(token)
        if payload.get("type") != "access":
            logger.warning("Invalid token type")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token type"
            )
        return payload


_token_service: TokenService | None = None


def get_token_service() -> TokenService:
    global _token_service
    if _token_service is None:
        _token_service = TokenService()
    return _token_service


def get_current_user(
    request: Request,
    tokens: Annotated[TokenService, Depends(get_token_service)],
) -> dict:
    return tokens.get_current_user(request)
