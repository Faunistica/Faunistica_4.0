import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_metadata_after_completion_returns_403(
    async_client: AsyncClient, auth_tokens, test_users, session_maker, seed_data
) -> None:
    async with session_maker() as session:
        from sqlalchemy import select

        from core.model import User

        stmt = select(User).where(User.user_id == test_users[0]["user_id"])
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.items = "1"
            await session.commit()

    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])

    # First complete the publication
    response = await async_client.post(
        "/api/publications/1/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Try to add metadata after completion
    response = await async_client.post(
        "/api/publications/1/metadata",
        json={"urals_scope": "ural", "material_status": "complete"},
    )
    assert response.status_code == 403
    assert response.json()["error"] == "PUBL_COMPLETED"


@pytest.mark.asyncio
async def test_metadata_success(
    async_client: AsyncClient, auth_tokens, test_users, session_maker, seed_data
) -> None:
    async with session_maker() as session:
        from sqlalchemy import select

        from core.model import User

        stmt = select(User).where(User.user_id == test_users[0]["user_id"])
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.items = "1"
            await session.commit()

    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.post(
        "/api/publications/1/metadata",
        json={"urals_scope": "ural", "material_status": "complete"},
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_metadata_partial_update(
    async_client: AsyncClient, auth_tokens, test_users, session_maker, seed_data
) -> None:
    async with session_maker() as session:
        from sqlalchemy import select

        from core.model import User

        stmt = select(User).where(User.user_id == test_users[0]["user_id"])
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.items = "1"
            await session.commit()

    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.post(
        "/api/publications/1/metadata",
        json={"urals_scope": "ural"},
    )
    assert response.status_code == 204
