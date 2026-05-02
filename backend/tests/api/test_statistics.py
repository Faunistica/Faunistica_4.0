from datetime import datetime
from uuid import uuid4

import pytest
from httpx import AsyncClient

from core.model import Action, EventRecord, Publication, User


@pytest.mark.asyncio
async def test_get_project_statistics(async_client: AsyncClient, session_maker):
    async with session_maker() as session:
        # Add test data
        user = User(
            user_id=999,
            name="stats_test_user",
            reg_stat=7,
            items="1",
        )
        session.add(user)
        await session.flush()  # Flush to get the user in DB before adding action

        publ = Publication(
            id=999,
            author="Test Author",
            name="Test Publication",
        )
        session.add(publ)
        await session.flush()  # Flush publication so record can reference it

        record = EventRecord(
            id=uuid4(),
            publ_id=999,
            user_id=999,
            type="rec_ok",
            genus="TestGenus",
            species="test_species",
            family="TestFamily",
            created_at=datetime.now(),
        )
        session.add(record)

        action = Action(
            user_id=999,
            action="publ_end_full",
            object="999",
            datetime=datetime.now(),
        )
        session.add(action)

        await session.commit()

    response = await async_client.get("/api/statistics/project")
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
async def test_get_user_statistics_by_id(async_client: AsyncClient, session_maker):
    async with session_maker() as session:
        # Check if publication 1 exists, if not create it
        from core.model import Publication

        publ = await session.get(Publication, 1)
        if publ is None:
            publ = Publication(id=1, author="Test Author", name="Test Publ")
            session.add(publ)
            await session.flush()

        user = User(
            user_id=998,
            name="stats_user_by_id",
            reg_stat=7,
            items="1",
        )
        session.add(user)
        await session.flush()

        record = EventRecord(
            id=uuid4(),
            publ_id=1,
            user_id=998,
            type="rec_ok",
            genus="GenusA",
            species="species_a",
            family="FamilyA",
            created_at=datetime.now(),
        )
        session.add(record)
        await session.commit()

    response = await async_client.get("/api/statistics/users?user_id=998")
    assert response.status_code == 200
    data = response.json()
    assert "records_entered" in data
    assert "publications_processed" in data
    assert "most_common_species" in data
    assert "most_common_family" in data
    assert "most_common_genus" in data
    assert data["records_entered"] >= 1


@pytest.mark.asyncio
async def test_get_user_statistics_by_name(async_client: AsyncClient, session_maker):
    async with session_maker() as session:
        user = User(
            user_id=997,
            name="stats_user_by_name",
            reg_stat=7,
            items="1",
        )
        session.add(user)
        await session.commit()

    response = await async_client.get("/api/statistics/users?name=stats_user_by_name")
    assert response.status_code == 200
    data = response.json()
    assert "records_entered" in data


@pytest.mark.asyncio
async def test_get_user_statistics_name_not_found(async_client: AsyncClient):
    response = await async_client.get("/api/statistics/users?name=nonexistent_user_xyz")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_user_statistics_id_not_found(async_client: AsyncClient):
    response = await async_client.get("/api/statistics/users?user_id=99999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_user_statistics_missing_param(async_client: AsyncClient):
    response = await async_client.get("/api/statistics/users")
    assert response.status_code == 400
    assert "detail" in response.json()
