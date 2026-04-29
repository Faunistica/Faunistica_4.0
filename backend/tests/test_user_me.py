from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from httpx import ASGITransport, AsyncClient

from app import app
from core.config import settings
from schema.jwt import TokenPayload


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
async def test_get_me_with_valid_jwt(async_client, test_users):
    token = create_test_token(test_users[0]["user_id"], test_users[0]["name"])
    async_client.cookies.set("access_token", token)
    response = await async_client.get("/api/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == test_users[0]["user_id"]
    assert data["name"] == test_users[0]["name"]


@pytest.mark.asyncio
async def test_get_me_without_jwt(async_client):
    response = await async_client.get("/api/users/me")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_put_me_update_language(async_client, test_users):
    token = create_test_token(test_users[0]["user_id"], test_users[0]["name"])
    async_client.cookies.set("access_token", token)
    response = await async_client.put(
        "/api/users/me",
        json={"lng": "en"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["lng"] == "en"


@pytest.mark.asyncio
async def test_put_me_update_email(async_client, test_users):
    token = create_test_token(test_users[0]["user_id"], test_users[0]["name"])
    async_client.cookies.set("access_token", token)
    response = await async_client.put(
        "/api/users/me",
        json={"email": "test@example.com"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_put_me_invalid_language(async_client, test_users):
    token = create_test_token(test_users[0]["user_id"], test_users[0]["name"])
    async_client.cookies.set("access_token", token)
    response = await async_client.put(
        "/api/users/me",
        json={"lng": "invalid"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_lookup_user_found(async_client, test_users):
    token = create_test_token(test_users[0]["user_id"], test_users[0]["name"])
    async_client.cookies.set("access_token", token)
    response = await async_client.get(
        "/api/users/lookup",
        params={"name": test_users[0]["name"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == test_users[0]["user_id"]
    assert data["name"] == test_users[0]["name"]


@pytest.mark.asyncio
async def test_lookup_user_not_found(async_client, test_users):
    token = create_test_token(test_users[0]["user_id"], test_users[0]["name"])
    async_client.cookies.set("access_token", token)
    response = await async_client.get(
        "/api/users/lookup",
        params={"name": "nonexistent_user"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_cannot_access_other_user_me(async_client, test_users):
    """Test that user cannot access another user's /me endpoint."""
    token = create_test_token(999, "other_user")
    async_client.cookies.set("access_token", token)
    response = await async_client.get("/api/users/me")
    assert response.status_code == 403
