import hashlib
import logging
from datetime import datetime, timedelta

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from schema.common import LoginRequest

logger = logging.getLogger(__name__)


def make_md5_hash(password: str) -> str:
    return hashlib.md5(password.encode()).hexdigest()  # noqa: S324 - testing legacy MD5


@pytest.fixture
def md5_password() -> str:
    return "test_password_123"


@pytest.fixture
def md5_hash(md5_password: str) -> str:
    return make_md5_hash(md5_password)


@pytest.fixture
async def create_test_user_with_hash(
    session: AsyncSession,
):
    """Create a test user with MD5 password hash."""
    from core.model import User

    async def create(
        user_id: int,
        username: str,
        md5_hash: str,
        hash_date: datetime | None = None,
    ) -> None:
        if hash_date is None:
            hash_date = datetime.now()

        user = User(
            user_id=user_id,
            name=username,
            hash=md5_hash,
            hash_date=hash_date,
            items="",
        )

        session.add(user)
        await session.commit()

    yield create


@pytest.mark.asyncio
async def test_login_valid_md5_password(
    async_client: AsyncClient,
    test_users,
    md5_password: str,
    md5_hash: str,
    create_test_user_with_hash,
) -> None:
    """Test login with valid MD5 password returns 200, sets cookies, logs fau_login."""
    await create_test_user_with_hash(
        test_users[0]["user_id"],
        test_users[0]["username"],
        md5_hash,
    )

    response = await async_client.post(
        "/api/auth/login",
        json={"username": test_users[0]["username"], "password": md5_password},
    )
    LoginRequest.model_validate(
        {"username": test_users[0]["username"], "password": md5_password},
    )
    print(response.json())

    assert response.status_code == status.HTTP_200_OK
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies
    data = response.json()
    assert data["username"] == test_users[0]["username"]
    assert data["user_id"] == test_users[0]["user_id"]


@pytest.mark.asyncio
async def test_login_invalid_password(
    async_client: AsyncClient,
    test_users,
    md5_hash: str,
    create_test_user_with_hash,
) -> None:
    """Test login with invalid password returns 401."""
    await create_test_user_with_hash(
        test_users[0]["user_id"],
        test_users[0]["username"],
        md5_hash,
    )

    response = await async_client.post(
        "/api/auth/login",
        json={"username": test_users[0]["username"], "password": "wrong_password"},
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_login_expired_hash_date(
    async_client: AsyncClient,
    test_users,
    md5_password: str,
    md5_hash: str,
    create_test_user_with_hash,
) -> None:
    """Test login with expired hash_date (>3000 minutes) returns 401."""
    expired_date = datetime.now() - timedelta(minutes=3001)
    await create_test_user_with_hash(
        test_users[0]["user_id"],
        test_users[0]["username"],
        md5_hash,
        hash_date=expired_date,
    )

    response = await async_client.post(
        "/api/auth/login",
        json={"username": test_users[0]["username"], "password": md5_password},
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_logout_clears_cookies(
    async_client: AsyncClient,
    test_users,
    md5_password: str,
    md5_hash: str,
    create_test_user_with_hash,
) -> None:
    """Test logout returns 200, clears cookies."""
    await create_test_user_with_hash(
        test_users[0]["user_id"],
        test_users[0]["username"],
        md5_hash,
    )

    login_response = await async_client.post(
        "/api/auth/login",
        json={"username": test_users[0]["username"], "password": md5_password},
    )
    assert login_response.status_code == status.HTTP_200_OK

    logout_response = await async_client.post("/api/auth/logout")
    assert logout_response.status_code == status.HTTP_200_OK

    cookies = logout_response.cookies
    assert cookies.get("access_token") is None
    assert cookies.get("refresh_token") is None


@pytest.mark.asyncio
async def test_check_valid_cookie(
    async_client: AsyncClient,
    test_users,
    md5_password: str,
    md5_hash: str,
    create_test_user_with_hash,
) -> None:
    """Test check with valid cookie returns 200 + user info."""
    await create_test_user_with_hash(
        test_users[0]["user_id"],
        test_users[0]["username"],
        md5_hash,
    )

    login_response = await async_client.post(
        "/api/auth/login",
        json={"username": test_users[0]["username"], "password": md5_password},
    )
    assert login_response.status_code == status.HTTP_200_OK

    token = login_response.cookies.get("access_token")
    assert token is not None

    check_response = await async_client.post(
        "/api/auth/check", cookies=[("access_token", token)]
    )
    assert check_response.status_code == status.HTTP_200_OK
    data = check_response.json()
    assert data["user_id"] == test_users[0]["user_id"]
    assert data["username"] == test_users[0]["username"]


@pytest.mark.asyncio
async def test_check_invalid_cookie(async_client: AsyncClient) -> None:
    """Test check without valid cookie returns 403."""
    response = await async_client.post("/api/auth/check")
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.asyncio
async def test_refresh_token_flow(
    async_client: AsyncClient,
    test_users,
    md5_password: str,
    md5_hash: str,
    create_test_user_with_hash,
) -> None:
    """Test refresh token flow."""
    await create_test_user_with_hash(
        test_users[0]["user_id"],
        test_users[0]["username"],
        md5_hash,
    )

    login_response = await async_client.post(
        "/api/auth/login",
        json={"username": test_users[0]["username"], "password": md5_password},
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
