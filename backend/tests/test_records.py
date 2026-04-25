import pytest
from fastapi import status
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_record(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.post(
        "/api/user/1/record/",
        json={"user_id": 1, "publ_id": 1},
    )
    assert response.status_code == 201
    # FIXME: 4 as there are 3 test records created, maybe should configure
    # this test in some other way
    assert response.json()["id"] == 4


@pytest.mark.asyncio
async def test_get_record(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.get("/api/user/1/record/1")
    assert response.status_code == 200


@pytest.mark.skip
@pytest.mark.asyncio
async def test_list_records(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.get("/api/user/1/record")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_record_set_coords(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.put(
        "/api/user/1/record/3",
        json={"latitude": 55.7, "longitude": 37.7},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_record_clear_coords(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.put(
        "/api/user/1/record/1",
        json={"latitude": None, "longitude": None},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_record_set_genus(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.put(
        "/api/user/1/record/3/",
        json={"genus": "UpdatedGenus"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_record_clear_genus(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.put(
        "/api/user/1/record/1",
        json={"genus": None},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_delete_record(
    async_client: AsyncClient, auth_token: dict, seed_test_data
) -> None:
    async_client.cookies.set("access_token", auth_token["access_token"])
    response = await async_client.delete("/api/user/1/record/3")
    assert response.status_code == status.HTTP_204_NO_CONTENT
