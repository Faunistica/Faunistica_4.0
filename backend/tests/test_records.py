import pytest
from fastapi import status
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_record(
    async_client: AsyncClient, auth_token: dict, test_users, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.post(
        "/api/records",
        json={"user_id": test_users[0]["user_id"], "publ_id": 1},
    )
    assert response.status_code == 201
    assert "id" in response.json()


@pytest.mark.asyncio
async def test_get_record(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    record_id = seed_test_data["record_ids"][0]
    response = await async_client.get(f"/api/records/{record_id}?user_id=1")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_records(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.get(
        "/api/records?user_id=1&publ_id=1&page=1&page_size=20"
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_update_record_set_coords(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    record_id = seed_test_data["record_ids"][2]
    response = await async_client.put(
        f"/api/records/{record_id}?user_id=1",
        json={"publ_id": 1, "latitude": 55.7, "longitude": 37.7},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_record_clear_coords(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    record_id = seed_test_data["record_ids"][0]
    response = await async_client.put(
        f"/api/records/{record_id}?user_id=1",
        json={"publ_id": 1, "latitude": None, "longitude": None},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_record_set_genus(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    record_id = seed_test_data["record_ids"][2]
    response = await async_client.put(
        f"/api/records/{record_id}?user_id=1",
        json={"publ_id": 1, "genus": "UpdatedGenus"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_record_clear_genus(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    record_id = seed_test_data["record_ids"][0]
    response = await async_client.put(
        f"/api/records/{record_id}?user_id=1",
        json={"publ_id": 1, "genus": None},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_delete_record(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    record_id = seed_test_data["record_ids"][2]
    response = await async_client.delete(f"/api/records/{record_id}?user_id=1")
    assert response.status_code == status.HTTP_204_NO_CONTENT
