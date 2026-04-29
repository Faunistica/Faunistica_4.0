from unittest.mock import AsyncMock, patch

import pytest
from conftest import create_test_token
from fastapi import status
from httpx import AsyncClient


@pytest.fixture(scope="module")
def auth_cookies():
    token = create_test_token(1, "testuser1", "access")
    return {"access_token": token}


@pytest.mark.asyncio
async def test_metadata_success(async_client: AsyncClient, auth_cookies) -> None:
    with (
        patch(
            "api.publications.metadata.get_user", new_callable=AsyncMock
        ) as mock_get_user,
        patch("service.actions.ActionService.save_action", new_callable=AsyncMock),
    ):
        mock_user = AsyncMock()
        mock_user.items = "123|456"
        mock_get_user.return_value = mock_user

        response = await async_client.post(
            "/api/publications/123/metadata",
            json={"urals_scope": "test_scope", "material_status": "test_status"},
            cookies=auth_cookies,
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.asyncio
async def test_metadata_404(async_client: AsyncClient, auth_cookies) -> None:
    with patch(
        "api.publications.metadata.get_user", new_callable=AsyncMock
    ) as mock_get_user:
        mock_get_user.return_value = None

        response = await async_client.post(
            "/api/publications/999/metadata",
            json={"urals_scope": "test"},
            cookies=auth_cookies,
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_metadata_401(async_client: AsyncClient) -> None:
    response = await async_client.post(
        "/api/publications/123/metadata",
        json={"urals_scope": "test"},
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.asyncio
async def test_comments_success(async_client: AsyncClient, auth_cookies) -> None:
    with (
        patch(
            "api.publications.comments.get_user", new_callable=AsyncMock
        ) as mock_get_user,
        patch("service.actions.ActionService.save_action", new_callable=AsyncMock),
    ):
        mock_user = AsyncMock()
        mock_user.items = "123|456"
        mock_get_user.return_value = mock_user

        response = await async_client.post(
            "/api/publications/123/comments",
            json={"comment": "This is a test comment"},
            cookies=auth_cookies,
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.asyncio
async def test_comments_422_short_comment(
    async_client: AsyncClient, auth_cookies
) -> None:
    """Test that pydantic validation returns 422 for short comments."""
    response = await async_client.post(
        "/api/publications/123/comments",
        json={"comment": "a"},
        cookies=auth_cookies,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_comments_404(async_client: AsyncClient, auth_cookies) -> None:
    with patch(
        "api.publications.comments.get_user", new_callable=AsyncMock
    ) as mock_get_user:
        mock_get_user.return_value = None

        response = await async_client.post(
            "/api/publications/999/comments",
            json={"comment": "This is a test comment"},
            cookies=auth_cookies,
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_comments_401(async_client: AsyncClient) -> None:
    response = await async_client.post(
        "/api/publications/123/comments",
        json={"comment": "This is a test comment"},
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
