import pytest
from conftest import create_test_token
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import Publication, User
from service.publications import array_to_pipe, pipe_to_array


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
async def test_get_current_publication_with_queue(
    async_client: AsyncClient,
    auth_tokens: dict,
    session: AsyncSession,
    test_users: list[dict],
) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])

    user = test_users[0]

    session.add(Publication(id=2, name="Publ 2", author="Author 2", year=2024))
    session.add(
        User(user_id=user["user_id"], name=user["username"], publ_id=2, items="2")
    )
    await session.commit()

    response = await async_client.get("/api/publications/current")
    assert response.status_code == 200
    data = response.json()
    assert data[0]["id"] == 2


@pytest.mark.asyncio
async def test_get_current_publication_empty_queue(
    async_client: AsyncClient, auth_tokens: dict, session: AsyncSession, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_tokens[1]["access_token"])

    response = await async_client.get("/api/publications/current")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0
