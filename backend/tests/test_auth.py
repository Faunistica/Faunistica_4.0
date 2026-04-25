import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_valid_credentials(
    async_client: AsyncClient,
    seed_test_data,
) -> None:
    response = await async_client.post(
        "/api/auth/login",
        json={"username": "testuser1", "password": "password1"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_login_wrong_password(
    async_client: AsyncClient,
    seed_test_data,
) -> None:
    response = await async_client.post(
        "/api/auth/login",
        json={"username": "testuser1", "password": "wrongpassword"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(
    async_client: AsyncClient,
    seed_test_data,
) -> None:
    response = await async_client.post(
        "/api/auth/login",
        json={"username": "nonexistent", "password": "password"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_logout_with_valid_jwt(
    async_client: AsyncClient,
    test_users,
    auth_token,
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    async_client.cookies.set("refresh_token", auth_token["refresh_token"])
    response = await async_client.post("/api/auth/logout")
    assert 200 <= response.status_code < 300


@pytest.mark.asyncio
async def test_token_refresh(
    async_client: AsyncClient,
    test_users,
    auth_token,
) -> None:
    async_client.cookies.set("refresh_token", auth_token["refresh_token"])
    response = await async_client.post("/api/auth/refresh")
    assert 200 <= response.status_code < 300
