import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_me_with_valid_jwt(
    authenticated_client: AsyncClient,
    test_users: list[dict],
) -> None:
    response = await authenticated_client.get("/api/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == test_users[0]["user_id"]
    assert data["name"] == test_users[0]["username"]


@pytest.mark.asyncio
async def test_get_me_without_jwt(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/users/me")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_put_me_update_language(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    response = await authenticated_client.put(
        "/api/users/me",
        json={"lng": "eng"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["lng"] == "eng"


@pytest.mark.asyncio
async def test_put_me_update_email(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    response = await authenticated_client.put(
        "/api/users/me",
        json={"email": "test@example.com"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_put_me_invalid_language(
    authenticated_client: AsyncClient,
    test_users: list[dict],
) -> None:
    response = await authenticated_client.put(
        "/api/users/me",
        json={"lng": "esp"},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_lookup_user_found(
    authenticated_client: AsyncClient,
    test_users: list[dict],
    seed_data: dict,
) -> None:
    response = await authenticated_client.get(
        "/api/users/lookup",
        params={"name": test_users[0]["username"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == test_users[0]["user_id"]
    assert data["name"] == test_users[0]["username"]


@pytest.mark.asyncio
async def test_lookup_user_not_found(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    response = await authenticated_client.get(
        "/api/users/lookup",
        params={"name": "nonexistent_user"},
    )
    assert response.status_code == 404
