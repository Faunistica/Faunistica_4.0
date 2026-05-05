import random
from datetime import datetime
from uuid import uuid4

import pytest
from conftest import SeedData
from httpx import AsyncClient

from core.enums import UserState
from core.model import Action, EventRecord, Publication, User


@pytest.mark.asyncio
async def test_get_project_statistics(
    authenticated_client: AsyncClient, session_maker, seed_data: SeedData
):
    async with session_maker() as session:
        # Add test data
        test_user_id = random.randint(10000, 99999)
        test_publ_id = random.randint(10000, 99999)

        user = User(
            user_id=test_user_id,
            name="stats_test_user",
            reg_stat=UserState.SUPPORT,
            items=str(test_publ_id),
        )
        session.add(user)
        await session.flush()  # Flush to get the user in DB before adding action

        publ = Publication(
            id=test_publ_id,
            author="Test Author",
            name="Test Publication",
        )
        session.add(publ)
        await session.flush()  # Flush publication so record can reference it

        record = EventRecord(
            id=uuid4(),
            publ_id=test_publ_id,
            user_id=test_user_id,
            type="rec_ok",
            genus="TestGenus",
            species="test_species",
            family="TestFamily",
            created_at=datetime.now(),
        )
        session.add(record)

        action = Action(
            user_id=test_user_id,
            action="publ_end_full",
            object=str(test_publ_id),
            datetime=datetime.now(),
        )
        session.add(action)

        await session.commit()

    response = await authenticated_client.get("/api/statistics/project")
    assert response.status_code == 200
    data = response.json()
    assert "total_volunteers" in data
    assert "total_records" in data
    assert "species_count" in data
    assert "processed_publications_count" in data
    assert "most_common_family" in data
    assert "most_common_genus" in data
    assert "most_common_species" in data
    assert data["total_volunteers"] >= 1
    assert data["total_records"] >= 1
    assert data["species_count"] >= 1


@pytest.mark.asyncio
async def test_get_user_statistics_by_id(
    authenticated_client: AsyncClient, session_maker, seed_data
):
    async with session_maker() as session:
        publ_id = seed_data["publs"][0].id

        user = User(
            user_id=random.randint(10000, 99999),
            name="stats_user_by_id",
            reg_stat=UserState.SUPPORT,
            items=str(publ_id),
        )
        session.add(user)
        await session.flush()

        record = EventRecord(
            id=uuid4(),
            publ_id=publ_id,
            user_id=user.user_id,
            type="rec_ok",
            genus="GenusA",
            species="species_a",
            family="FamilyA",
            created_at=datetime.now(),
        )
        session.add(record)
        await session.commit()

    response = await authenticated_client.get(
        f"/api/statistics/users?user_id={user.user_id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert "records_entered" in data
    assert "publications_processed" in data
    assert "most_common_species" in data
    assert "most_common_family" in data
    assert "most_common_genus" in data
    assert data["records_entered"] >= 1


@pytest.mark.asyncio
async def test_get_user_statistics_by_name(
    authenticated_client: AsyncClient, session_maker, seed_data
):
    async with session_maker() as session:
        user = User(
            user_id=random.randint(10000, 99999),
            name="stats_user_by_name",
            reg_stat=UserState.SUPPORT,
            items=str(seed_data["publs"][0].id),
        )
        session.add(user)
        await session.commit()

    response = await authenticated_client.get(
        "/api/statistics/users?name=stats_user_by_name"
    )
    assert response.status_code == 200
    data = response.json()
    assert "records_entered" in data


@pytest.mark.asyncio
async def test_get_user_statistics_name_not_found(authenticated_client: AsyncClient):
    response = await authenticated_client.get(
        "/api/statistics/users?name=nonexistent_user_xyz"
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_user_statistics_id_not_found(authenticated_client: AsyncClient):
    response = await authenticated_client.get("/api/statistics/users?user_id=99999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_user_statistics_missing_param(authenticated_client: AsyncClient):
    response = await authenticated_client.get("/api/statistics/users")
    assert response.status_code == 400
    assert "detail" in response.json()
