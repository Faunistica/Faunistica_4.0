import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_comment_after_completion_returns_403(
    async_client: AsyncClient, auth_tokens, test_users, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])

    # First complete the publication
    response = await async_client.post(
        "/api/publications/1/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Try to add comment after completion
    response = await async_client.post(
        "/api/publications/1/comments",
        json={"comment": "This is a test comment with enough length"},
    )
    assert response.status_code == 403
    assert response.json()["error"] == "PUBL_FORBIDDEN"


@pytest.mark.asyncio
async def test_comment_success(
    async_client: AsyncClient, auth_tokens, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.post(
        "/api/publications/1/comments",
        json={"comment": "This is a test comment with enough length"},
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_comment_too_short(
    async_client: AsyncClient, auth_tokens, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.post(
        "/api/publications/1/comments",
        json={"comment": "short"},
    )
    assert response.status_code == 422
