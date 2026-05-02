import logging

import pytest
from conftest import SeedData
from fastapi import status
from httpx import AsyncClient

logger = logging.getLogger(__name__)


@pytest.mark.asyncio
async def test_login_rate_limit_exceeded(
    async_client: AsyncClient, seed_data: SeedData, enable_rate_limiting
) -> None:
    """Exceed login rate limit (5/minute) and verify 429 response."""
    user = seed_data["users"][0]

    responses = []
    for _ in range(7):
        response = await async_client.post(
            "/api/auth/login",
            json={
                "username": user.name,
                "password": "wrong_password",
            },
        )
        responses.append(response)

    assert any(r.status_code == status.HTTP_429_TOO_MANY_REQUESTS for r in responses), (
        "Expected 429 for rate limit exceeded"
    )


@pytest.mark.asyncio
async def test_login_within_rate_limit(
    async_client: AsyncClient, seed_data, enable_rate_limiting
) -> None:
    """Normal login request within rate limit should not return 429."""
    user = seed_data["users"][0]
    password = seed_data["passwords"][0]

    response = await async_client.post(
        "/api/auth/login",
        json={
            "username": user.name,
            "password": password,
        },
    )

    assert response.status_code != status.HTTP_429_TOO_MANY_REQUESTS


@pytest.mark.asyncio
async def test_global_rate_limit_applies(
    async_client: AsyncClient,
    enable_rate_limiting,
) -> None:
    """Global rate limit should apply to /api/ routes."""
    responses = []
    for _ in range(110):
        response = await async_client.get(
            "/api/taxonomy/suggest",
            params={"field": "genus", "text": "test"},
        )
        responses.append(response)

    assert any(r.status_code == status.HTTP_429_TOO_MANY_REQUESTS for r in responses), (
        "Expected 429 from global rate limit"
    )
