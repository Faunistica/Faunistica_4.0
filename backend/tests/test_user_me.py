from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from httpx import ASGITransport, AsyncClient

from app import app
from core.config import settings
from schemas.jwt import TokenPayload


def create_test_token(user_id: int, username: str) -> str:
    expires = datetime.now(UTC) + timedelta(minutes=30)
    payload = TokenPayload(sub=str(user_id), username=username)
    token_data = {**payload.model_dump(), "type": "access", "exp": expires}
    return jwt.encode(
        token_data,
        settings.JWT_SECRET.get_secret_value(),
        algorithm="HS256",
    )


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient]:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.mark.asyncio
async def test_get_me_with_valid_jwt(async_client):
    token = create_test_token(1, "testuser")
    async_client.cookies.set("access_token", token)
    response = await async_client.get("/api/user/me")
    assert response.status_code == 200
    data = response.json()
    assert "user_id" in data
    assert "username" in data


@pytest.mark.asyncio
async def test_get_me_without_jwt(async_client):
    response = await async_client.get("/api/user/me")
    assert response.status_code == 403
