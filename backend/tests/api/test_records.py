from collections.abc import Callable
from datetime import UTC, datetime
from uuid import uuid4

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import EventRecord, User


@pytest.mark.asyncio
async def test_create_record(authenticated_client: AsyncClient, seed_data) -> None:
    user = seed_data["users"][0]

    response = await authenticated_client.post(
        "/api/records",
        json={"user_id": user.user_id, "publ_id": 1},
    )
    assert response.status_code == 201
    assert "id" in response.json()


@pytest.mark.asyncio
async def test_get_record(authenticated_client: AsyncClient, seed_data) -> None:
    record_id = seed_data["record_ids"][0]
    response = await authenticated_client.get(f"/api/records/{record_id}?user_id=1")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_records(authenticated_client: AsyncClient, seed_data) -> None:
    response = await authenticated_client.get(
        "/api/records?user_id=1&publ_id=1&page=1&page_size=20"
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_update_record_set_coords(
    authenticated_client: AsyncClient, seed_data
) -> None:
    record_id = seed_data["record_ids"][2]
    response = await authenticated_client.put(
        f"/api/records/{record_id}?user_id=1",
        json={"publ_id": 1, "latitude": 55.7, "longitude": 37.7},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_record_clear_coords(
    authenticated_client: AsyncClient, seed_data
) -> None:
    record_id = seed_data["record_ids"][0]
    response = await authenticated_client.put(
        f"/api/records/{record_id}?user_id=1",
        json={"publ_id": 1, "latitude": None, "longitude": None},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_record_set_genus(
    authenticated_client: AsyncClient, seed_data
) -> None:
    record_id = seed_data["record_ids"][2]
    response = await authenticated_client.put(
        f"/api/records/{record_id}?user_id=1",
        json={"publ_id": 1, "genus": "UpdatedGenus"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_record_clear_genus(
    authenticated_client: AsyncClient, seed_data
) -> None:
    record_id = seed_data["record_ids"][0]
    response = await authenticated_client.put(
        f"/api/records/{record_id}?user_id=1",
        json={"publ_id": 1, "genus": None},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_delete_record(authenticated_client: AsyncClient, seed_data) -> None:
    record_id = seed_data["record_ids"][0]
    response = await authenticated_client.delete(f"/api/records/{record_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.asyncio
async def test_list_records_no_token(async_client: AsyncClient):
    response = await async_client.get("/api/records?user_id=1&publ_id=1")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_record_wrong_user(
    authenticated_client_user2: AsyncClient, seed_data
):
    # user2 tries to access user 1's record
    record_id = seed_data["record_ids"][0]
    response = await authenticated_client_user2.get(
        f"/api/records/{record_id}?user_id=2"
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_records_missing_publ_id(authenticated_client, seed_data):
    response = await authenticated_client.get("/api/records?user_id=1")
    assert response.status_code == 422  # FastAPI validation error


@pytest.mark.asyncio
async def test_list_records_invalid_sort(authenticated_client, seed_data):
    response = await authenticated_client.get(
        "/api/records?user_id=1&publ_id=1&sort=invalid"
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_records_page_size_exceeds_max(authenticated_client, seed_data):
    response = await authenticated_client.get(
        "/api/records?user_id=1&publ_id=1&page_size=200"
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_records_pagination_second_page(authenticated_client, seed_data):
    response = await authenticated_client.get(
        "/api/records?user_id=1&publ_id=1&page=2&page_size=1"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 2


@pytest.mark.asyncio
async def test_list_records_sort_updated_at(authenticated_client, seed_data):
    response = await authenticated_client.get(
        "/api/records?user_id=1&publ_id=1&sort=updated_at"
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_record_not_found(authenticated_client, seed_data):
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await authenticated_client.get(f"/api/records/{fake_uuid}?user_id=1")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_record_not_found(authenticated_client, seed_data):
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await authenticated_client.put(
        f"/api/records/{fake_uuid}", json={"publ_id": 1, "latitude": 55.5}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_record_invalid_uuid(authenticated_client, seed_data):
    response = await authenticated_client.get("/api/records/not-a-uuid?user_id=1")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_delete_record_previous_publ_403(
    authenticated_client: AsyncClient,
    session_maker: Callable[[], AsyncSession],
    seed_data,
) -> None:
    """Test that deleting a record from a previous publication returns 403."""
    # Create a record with publ_id=2 (different from user's current publ_id=1)
    async with session_maker() as session:
        now = datetime.now(UTC).replace(tzinfo=None)
        record = EventRecord(
            id=uuid4(),
            user_id=1,
            publ_id=2,  # Different publication
            type="rec_ok",
            created_at=now,
            updated_at=now,
        )
        session.add(record)
        await session.commit()

        response = await authenticated_client.delete(
            f"/api/records/{record.id}?user_id=1"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.json()["message"] == "Cannot modify record"


@pytest.mark.asyncio
async def test_export_records_default(
    authenticated_client: AsyncClient, seed_data
) -> None:
    """Test export returns Excel file with user's records."""
    response = await authenticated_client.get("/api/records/export?user_id=1")
    assert response.status_code == 200
    assert (
        response.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert "attachment" in response.headers["content-disposition"]


@pytest.mark.asyncio
@pytest.mark.skip
async def test_export_records_project_admin(
    authenticated_client: AsyncClient, seed_data, session: AsyncSession
) -> None:
    """Test export with scope=project returns full dataset for admin."""
    # Make user an admin
    result = await session.execute(select(User).where(User.user_id == 1))
    user = result.scalar_one()
    user.items = "admin"
    await session.commit()

    response = await authenticated_client.get(
        "/api/records/export?user_id=1&scope=project"
    )
    assert response.status_code == 200
    assert (
        response.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@pytest.mark.asyncio
async def test_export_records_project_non_admin_403(
    authenticated_client: AsyncClient, seed_data
) -> None:
    """Test export with scope=project returns 403 for non-admin."""
    response = await authenticated_client.get(
        "/api/records/export?user_id=1&scope=project"
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
