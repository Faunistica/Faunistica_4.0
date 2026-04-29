import pytest
from conftest import create_test_token
from httpx import AsyncClient

from api.publications.current import array_to_pipe, pipe_to_array


class TestPipeConversion:
    def test_pipe_to_array_multiple(self) -> None:
        assert pipe_to_array("123|456|789") == [123, 456, 789]

    def test_pipe_to_array_trailing_pipe(self) -> None:
        assert pipe_to_array("123|") == [123]

    def test_pipe_to_array_empty_string(self) -> None:
        assert pipe_to_array("") == []

    def test_pipe_to_array_single(self) -> None:
        assert pipe_to_array("123") == [123]

    def test_pipe_to_array_extra_pipes(self) -> None:
        assert pipe_to_array("123||456|") == [123, 456]

    def test_array_to_pipe_multiple(self) -> None:
        assert array_to_pipe([123, 456, 789]) == "123|456|789"

    def test_array_to_pipe_empty(self) -> None:
        assert array_to_pipe([]) == ""


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
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_current_publication_with_queue(
    async_client: AsyncClient, auth_token: dict, session, seed_data
) -> None:
    from core.model import Publ
    from repository.publication import update_user_items

    async_client.cookies.set("access_token", auth_token["access_token"])

    session.add(Publ(id=2, name="Publ 2", author="Author 2", year=2024))
    await session.flush()

    # Update user queue to include both publications
    await update_user_items(session, 1, "1|2")
    await session.commit()

    response = await async_client.get("/api/publications/current")
    assert response.status_code == 200
    data = response.json()
    assert data["publ_id"] == 1
    assert data["queue_remaining"] == 1


@pytest.mark.asyncio
async def test_get_current_publication_empty_queue(
    async_client: AsyncClient, auth_token: dict, session, seed_data
) -> None:
    from repository.publication import update_user_items

    async_client.cookies.set("access_token", auth_token["access_token"])

    # Clear user queue
    await update_user_items(session, 1, "")
    await session.commit()

    response = await async_client.get("/api/publications/current")
    assert response.status_code == 200
    data = response.json()
    assert data["publ_id"] is None
    assert data["queue_remaining"] == 0


@pytest.mark.asyncio
async def test_get_current_publication_user_not_found(
    async_client: AsyncClient,
) -> None:
    token = create_test_token(999, "nonexistent", "access")
    async_client.cookies.set("access_token", token)

    response = await async_client.get("/api/publications/current")
    assert response.status_code == 404
