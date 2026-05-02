from unittest.mock import AsyncMock, patch

import pytest
from fastapi import status
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_support_with_valid_username(
    async_client: AsyncClient,
    test_users,
    seed_data,
) -> None:
    """POST with valid username returns 200, returns Message with ok."""
    with patch("service.telegram.support_message", new_callable=AsyncMock):
        response = await async_client.post(
            "/api/support",
            json={
                "link": "http://example.com",
                "user_name": test_users[0]["username"],
                "text": "Test support request",
                "issue_type": "bug",
            },
        )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "ok"


@pytest.mark.asyncio
async def test_support_with_invalid_username(
    async_client: AsyncClient,
    test_users,
    seed_data,
) -> None:
    """POST with invalid username returns 404."""
    with patch("service.telegram.support_message", new_callable=AsyncMock):
        response = await async_client.post(
            "/api/support",
            json={
                "link": "http://example.com",
                "user_name": "nonexistent_user",
                "text": "Test support request",
                "issue_type": "bug",
            },
        )

    assert response.status_code == status.HTTP_404_NOT_FOUND
