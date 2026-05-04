import logging
from collections.abc import Callable
from datetime import datetime, timedelta

import pytest
from conftest import SeedData
from fastapi import status
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import User

logger = logging.getLogger(__name__)


@pytest.mark.asyncio
async def test_login_valid_md5_password(
    async_client: AsyncClient, seed_data: SeedData
) -> None:
    """Test login with valid MD5 password returns 200, sets cookies, logs fau_login."""
    user = seed_data["users"][0]
    password = seed_data["passwords"][0]

    response = await async_client.post(
        "/api/auth/login",
        json={"username": user.name, "password": password},
    )

    assert response.status_code == status.HTTP_200_OK
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies
    data = response.json()
    assert data["username"] == user.name
    assert data["user_id"] == user.user_id


@pytest.mark.asyncio
async def test_login_invalid_password(
    async_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    """Test login with invalid password returns 401."""
    user = seed_data["users"][0]
    password = seed_data["passwords"][0]

    response = await async_client.post(
        "/api/auth/login",
        json={"username": user.name, "password": "wrong" + password},
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_login_expired_hash_date(
    async_client: AsyncClient,
    seed_data: SeedData,
    session_maker: Callable[[], AsyncSession],
) -> None:
    """Test login with expired hash_date (>3000 minutes) returns 401."""
    user: User = seed_data["users"][0]
    password = seed_data["passwords"][0]

    async with session_maker() as session:
        expired_date = datetime.now() - timedelta(minutes=3001)

        await session.execute(
            update(User)
            .where(User.user_id == user.user_id)
            .values(hash_date=expired_date)
        )

        await session.commit()

    response = await async_client.post(
        "/api/auth/login",
        json={"username": user.name, "password": password},
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_logout_clears_cookies(
    async_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    """Test logout returns 200, clears cookies."""
    user = seed_data["users"][0]
    password = seed_data["passwords"][0]

    login_response = await async_client.post(
        "/api/auth/login",
        json={"username": user.name, "password": password},
    )
    assert login_response.status_code == status.HTTP_200_OK

    logout_response = await async_client.post("/api/auth/logout")
    assert logout_response.status_code == status.HTTP_200_OK

    cookies = logout_response.cookies
    assert cookies.get("access_token") is None
    assert cookies.get("refresh_token") is None


@pytest.mark.asyncio
async def test_refresh_token_flow(
    async_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    """Test refresh token flow."""
    user = seed_data["users"][0]
    password = seed_data["passwords"][0]

    login_response = await async_client.post(
        "/api/auth/login",
        json={"username": user.name, "password": password},
    )
    assert login_response.status_code == status.HTTP_200_OK

    token = login_response.cookies.get("refresh_token")
    assert token is not None

    refresh_response = await async_client.post(
        "/api/auth/refresh", cookies=[("refresh_token", token)]
    )
    assert refresh_response.status_code == status.HTTP_200_OK
    assert "access_token" in refresh_response.cookies


@pytest.mark.asyncio
async def test_refresh_invalid_token(async_client: AsyncClient) -> None:
    """Test refresh with invalid token returns 403."""
    response = await async_client.post("/api/auth/refresh")
    assert response.status_code == status.HTTP_403_FORBIDDEN
