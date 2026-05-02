from collections.abc import Callable

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import Publication


@pytest.mark.asyncio
async def test_complete_full_logs_action(
    async_client: AsyncClient,
    auth_tokens,
    test_users,
    session_maker: Callable[[], AsyncSession],
    seed_data,
) -> None:
    async with session_maker() as session:
        from sqlalchemy import select

        from core.model import User

        stmt = select(User).where(User.user_id == test_users[0]["user_id"])
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.items = "1|2"
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
    async_client: AsyncClient, auth_tokens, seed_data
) -> None:
    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.post(
        "/api/publications/2/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_complete_queue_advancement(
    async_client: AsyncClient,
    auth_tokens,
    test_users,
    session_maker: Callable[[], AsyncSession],
    seed_data,
) -> None:
    async with session_maker() as session:
        from sqlalchemy import select

        from core.model import User

        publ = Publication(id=3, name="third")
        session.add(publ)
        await session.commit()

        stmt = select(User).where(User.user_id == test_users[0]["user_id"])
        result = await session.execute(stmt)
        user = result.scalar_one()

        user.items = "2|3"
        await session.commit()

    async_client.cookies.set("access_token", auth_tokens[0]["access_token"])
    response = await async_client.post(
        "/api/publications/1/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Complete second publication, should get third
    response = await async_client.post(
        "/api/publications/2/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Complete third publication, queue should be empty
    response = await async_client.post(
        "/api/publications/3/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    response = await async_client.post(
        "/api/publications/3/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.asyncio
async def test_complete_ural_logs_publ_end_ural(
    async_client: AsyncClient, auth_tokens, session_maker, seed_data
) -> None:
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
