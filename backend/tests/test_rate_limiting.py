import logging
from datetime import datetime, timedelta

import jwt
import pytest
from fastapi import status
from httpx import AsyncClient

from core.config import settings

logger = logging.getLogger(__name__)


@pytest.fixture
def auth_tokens_for_rate_limit(
    test_users,
    enable_rate_limiting,
):
    """Create auth tokens for rate limit testing."""
    from schema.jwt import Token

    def make_token(user_id: int, username: str) -> str:
        expires = datetime.now() + timedelta(minutes=30)
        payload = Token(sub=str(user_id), username=username, type="access", exp=expires)

        return jwt.encode(
            payload.model_dump(),
            settings.JWT_SECRET.get_secret_value(),
            algorithm="HS256",
        )

    return [make_token(u["user_id"], u["username"]) for u in test_users]


@pytest.mark.asyncio
async def test_login_rate_limit_exceeded(
    async_client: AsyncClient,
    test_users,
    md5_hash,
    create_test_user_with_hash,
    enable_rate_limiting,
) -> None:
    """Exceed login rate limit (5/minute) and verify 429 response."""
    await create_test_user_with_hash(
        test_users[0]["user_id"],
        test_users[0]["username"],
        md5_hash,
    )

    responses = []
    for _ in range(7):
        response = await async_client.post(
            "/api/auth/login",
            json={
                "username": test_users[0]["username"],
                "password": "wrong_password",
            },
        )
        responses.append(response)

    assert any(r.status_code == status.HTTP_429_TOO_MANY_REQUESTS for r in responses), (
        "Expected 429 for rate limit exceeded"
    )


@pytest.mark.asyncio
async def test_login_within_rate_limit(
    async_client: AsyncClient,
    test_users,
    md5_password,
    md5_hash,
    create_test_user_with_hash,
    enable_rate_limiting,
) -> None:
    """Normal login request within rate limit should not return 429."""
    await create_test_user_with_hash(
        test_users[0]["user_id"],
        test_users[0]["username"],
        md5_hash,
    )

    response = await async_client.post(
        "/api/auth/login",
        json={
            "username": test_users[0]["username"],
            "password": md5_password,
        },
    )

    assert response.status_code != status.HTTP_429_TOO_MANY_REQUESTS


@pytest.mark.asyncio
async def test_global_rate_limit_applies(
    async_client: AsyncClient,
    enable_rate_limiting,
) -> None:
    """Global rate limit should apply to /api/ routes."""
    responses = []
    for _ in range(110):
        response = await async_client.get(
            "/api/taxonomy/suggest",
            params={"field": "genus", "text": "test"},
        )
        responses.append(response)

    assert any(r.status_code == status.HTTP_429_TOO_MANY_REQUESTS for r in responses), (
        "Expected 429 from global rate limit"
    )
