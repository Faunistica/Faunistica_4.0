import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_get_current_publication_with_queue(
    async_client: AsyncClient,
    auth_tokens: dict,
    session: AsyncSession,
    seed_data,
    test_users,
) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])

    user = test_users[0]
    response = await async_client.get("/api/publications/current")
    assert response.status_code == 200
    data = response.json()
    assert data[0]["id"] == user["publ_id"]


@pytest.mark.asyncio
async def test_get_current_publication_empty_queue(
    async_client: AsyncClient, auth_tokens: dict, session: AsyncSession, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_tokens[1]["access_token"])

    response = await async_client.get("/api/publications/current")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0
