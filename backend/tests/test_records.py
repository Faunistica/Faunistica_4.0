import pytest
from httpx import AsyncClient


@pytest.mark.skip(reason="Requires seeded user and photo data in DB")
@pytest.mark.asyncio
async def test_create_record(async_client: AsyncClient, auth_token: dict[str, str], test_users: list):
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.post(
        "/api/user/1/record/",
        json={"type": "test_type"},
    )
    assert response.status_code == 201


@pytest.mark.skip(reason="Requires seeded user and photo data in DB")
@pytest.mark.asyncio
async def test_get_record(async_client: AsyncClient, auth_token: dict[str, str], test_users: list):
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.get("/api/user/1/record/1/")
    assert response.status_code == 200


@pytest.mark.skip(reason="Requires seeded user and photo data in DB")
@pytest.mark.asyncio
async def test_list_records(async_client: AsyncClient, auth_token: dict[str, str], test_users: list):
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.get("/api/user/1/record/?type=excel")
    assert response.status_code == 200


@pytest.mark.skip(reason="Requires seeded user and photo data in DB")
@pytest.mark.asyncio
async def test_update_record(async_client: AsyncClient, auth_token: dict[str, str], test_users: list):
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.put(
        "/api/user/1/record/1/",
        json={"type": "updated_type"},
    )
    assert response.status_code == 200


@pytest.mark.skip(reason="Requires seeded user and photo data in DB")
@pytest.mark.asyncio
async def test_delete_record(async_client: AsyncClient, auth_token: dict[str, str], test_users: list):
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.delete("/api/user/1/record/1/")
    assert response.status_code == 204
