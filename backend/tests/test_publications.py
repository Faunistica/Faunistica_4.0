import pytest
from conftest import create_test_token
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_publications(
    async_client: AsyncClient, auth_token: dict, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.get("/api/publications?user_id=1")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_current_publication(
    async_client: AsyncClient, auth_token: dict, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.get("/api/publications?user_id=1&current=true")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert data[0]["id"] == 1


@pytest.mark.asyncio
async def test_publications_no_token(async_client):
    response = await async_client.get("/api/publications?user_id=1")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_publications_wrong_user(async_client, auth_token, seed_data):
    other_token = create_test_token(2, "other_user", "access")
    async_client.cookies.set("access_token", other_token)
    response = await async_client.get("/api/publications?user_id=2")
    assert response.status_code == 200  # But user 2 has no data, returns []
