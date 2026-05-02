from datetime import datetime

import pytest
from fastapi import status
from httpx import AsyncClient

from core.model import Action


@pytest.mark.asyncio
async def test_winner_info_found(
    authenticated_client: AsyncClient,
    session,
    seed_data: dict,
) -> None:
    user = seed_data["users"][0]
    action = Action(
        user_id=user.user_id,
        action="fau_win",
        object="pic.jpg|Congratulations!",
        datetime=datetime.now(),
    )
    session.add(action)
    await session.commit()

    response = await authenticated_client.get("/api/users/me/winner")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["picfile"] == "pic.jpg"
    assert data["message"] == "Congratulations!"
    assert "datetime" in data


@pytest.mark.asyncio
async def test_winner_info_not_found(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    response = await authenticated_client.get("/api/users/me/winner")

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_winner_info_no_object(
    authenticated_client: AsyncClient,
    session,
    seed_data: dict,
) -> None:
    user = seed_data["users"][0]
    action = Action(
        user_id=user.user_id,
        action="fau_win",
        object=None,
        datetime=datetime.now(),
    )
    session.add(action)
    await session.commit()

    response = await authenticated_client.get("/api/users/me/winner")

    assert response.status_code == status.HTTP_404_NOT_FOUND
