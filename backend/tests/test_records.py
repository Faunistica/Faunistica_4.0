import pytest
from conftest import create_test_token
from fastapi import status
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_record(
    async_client: AsyncClient, auth_tokens: dict, test_users, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.post(
        "/api/records",
        json={"user_id": test_users[0]["user_id"], "publ_id": 1},
    )
    assert response.status_code == 201
    assert "id" in response.json()


@pytest.mark.asyncio
async def test_get_record(
    async_client: AsyncClient, auth_tokens: dict, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    record_id = seed_data["record_ids"][0]
    response = await async_client.get(f"/api/records/{record_id}?user_id=1")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_records(
    async_client: AsyncClient, auth_tokens: dict, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
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
    async_client: AsyncClient, auth_tokens: dict, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    record_id = seed_data["record_ids"][2]
    response = await async_client.put(
        f"/api/records/{record_id}?user_id=1",
        json={"publ_id": 1, "latitude": 55.7, "longitude": 37.7},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_record_clear_coords(
    async_client: AsyncClient, auth_tokens: dict, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    record_id = seed_data["record_ids"][0]
    response = await async_client.put(
        f"/api/records/{record_id}?user_id=1",
        json={"publ_id": 1, "latitude": None, "longitude": None},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_record_set_genus(
    async_client: AsyncClient, auth_tokens: dict, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    record_id = seed_data["record_ids"][2]
    response = await async_client.put(
        f"/api/records/{record_id}?user_id=1",
        json={"publ_id": 1, "genus": "UpdatedGenus"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_record_clear_genus(
    async_client: AsyncClient, auth_tokens: dict, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    record_id = seed_data["record_ids"][0]
    response = await async_client.put(
        f"/api/records/{record_id}?user_id=1",
        json={"publ_id": 1, "genus": None},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_delete_record(
    async_client: AsyncClient, auth_tokens: dict, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    record_id = seed_data["record_ids"][2]
    response = await async_client.delete(f"/api/records/{record_id}?user_id=1")
    assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.asyncio
async def test_list_records_no_token(async_client):
    response = await async_client.get("/api/records?user_id=1&publ_id=1")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_record_wrong_user(async_client, auth_tokens, seed_data):
    # Create token for user 2, try to access user 1's record
    other_token = create_test_token(2, "other_user", "access")
    async_client.cookies.set("access_token", other_token)
    record_id = seed_data["record_ids"][0]
    response = await async_client.get(f"/api/records/{record_id}?user_id=2")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_records_missing_publ_id(async_client, auth_tokens, seed_data):
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.get("/api/records?user_id=1")
    assert response.status_code == 422  # FastAPI validation error


@pytest.mark.asyncio
async def test_list_records_invalid_sort(async_client, auth_tokens, seed_data):
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.get("/api/records?user_id=1&publ_id=1&sort=invalid")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_records_page_size_exceeds_max(async_client, auth_tokens, seed_data):
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.get("/api/records?user_id=1&publ_id=1&page_size=200")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_records_pagination_second_page(
    async_client, auth_tokens, seed_data
):
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.get(
        "/api/records?user_id=1&publ_id=1&page=2&page_size=1"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 2


@pytest.mark.asyncio
async def test_list_records_sort_updated_at(async_client, auth_tokens, seed_data):
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.get(
        "/api/records?user_id=1&publ_id=1&sort=updated_at"
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_record_not_found(async_client, auth_tokens, seed_data):
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await async_client.get(f"/api/records/{fake_uuid}?user_id=1")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_record_not_found(async_client, auth_tokens, seed_data):
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await async_client.put(
        f"/api/records/{fake_uuid}?user_id=1", json={"publ_id": 1, "latitude": 55.5}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_record_invalid_uuid(async_client, auth_tokens, seed_data):
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.get("/api/records/not-a-uuid?user_id=1")
    assert response.status_code == 422
