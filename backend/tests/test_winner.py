from datetime import datetime

import pytest
from conftest import create_test_token
from fastapi import status
from httpx import AsyncClient

from core.model import Action


@pytest.fixture(scope="module")
def auth_cookies():
    token = create_test_token(1, "testuser1", "access")
    return {"access_token": token}


@pytest.mark.asyncio
async def test_winner_info_found(
    async_client: AsyncClient, auth_cookies, session, seed_data
) -> None:
    action = Action(
        user_id=1,
        action="fau_win",
        object="pic.jpg|Congratulations!",
        datetime=datetime.now(),
    )
    session.add(action)
    await session.commit()

    response = await async_client.get("/api/users/me/winner", cookies=auth_cookies)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["picfile"] == "pic.jpg"
    assert data["message"] == "Congratulations!"
    assert "datetime" in data


@pytest.mark.asyncio
async def test_winner_info_not_found(
    async_client: AsyncClient, auth_cookies, seed_data
) -> None:
    response = await async_client.get("/api/users/me/winner", cookies=auth_cookies)

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_winner_info_no_object(
    async_client: AsyncClient, auth_cookies, session, seed_data
) -> None:
    action = Action(
        user_id=1,
        action="fau_win",
        object=None,
        datetime=datetime.now(),
    )
    session.add(action)
    await session.commit()

    response = await async_client.get("/api/users/me/winner", cookies=auth_cookies)

    assert response.status_code == status.HTTP_404_NOT_FOUND
