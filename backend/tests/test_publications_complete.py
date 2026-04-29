import pytest
from fastapi import status
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_complete_full_logs_action(
    async_client: AsyncClient, auth_tokens, test_users, session_maker, seed_data
) -> None:
    async with session_maker() as session:
        from sqlalchemy import select

        from core.model import User

        stmt = select(User).where(User.user_id == test_users[0]["user_id"])
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.items = "1|2|3"
            await session.commit()

    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.post(
        "/api/publications/1/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204
    async with session_maker() as session:
        from sqlalchemy import select

        from core.model import Action

        stmt = select(Action).where(Action.action == "publ_end_full")
        result = await session.execute(stmt)
        action = result.scalar_one_or_none()
        assert action is not None
        assert action.object == "1"


@pytest.mark.asyncio
async def test_complete_wrong_publ_id(
    async_client: AsyncClient, auth_tokens, test_users, session_maker, seed_data
) -> None:
    async with session_maker() as session:
        from sqlalchemy import select

        from core.model import User

        stmt = select(User).where(User.user_id == test_users[0]["user_id"])
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.items = "1|2|3"
            await session.commit()

    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.post(
        "/api/publications/999/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_complete_queue_advancement(
    async_client: AsyncClient, auth_tokens, test_users, session_maker, seed_data
) -> None:
    async with session_maker() as session:
        from sqlalchemy import select

        from core.model import User

        stmt = select(User).where(User.user_id == test_users[0]["user_id"])
        result = await session.execute(stmt)
        user = result.scalar_one()

        user.items = "1|2|3"
        await session.commit()

    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.post(
        "/api/publications/1/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.asyncio
async def test_complete_ural_logs_publ_end_ural(
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
        "/api/publications/1/complete",
        json={"processing_level": "ural"},
    )
    assert response.status_code == 204
    async with session_maker() as session:
        from sqlalchemy import select

        from core.model import Action

        stmt = select(Action).where(Action.action == "publ_end_ural")
        result = await session.execute(stmt)
        action = result.scalar_one_or_none()
        assert action is not None


@pytest.mark.asyncio
async def test_complete_invalid_level(async_client: AsyncClient, auth_tokens) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.post(
        "/api/publications/1/complete",
        json={"processing_level": "invalid"},
    )
    assert response.status_code == 422
