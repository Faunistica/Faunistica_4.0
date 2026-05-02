import random

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from core.model import Action, Publication, User

# ========== Current Publication Tests ==========


@pytest.mark.asyncio
async def test_get_current_publication_with_queue(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    user = seed_data["users"][0]

    response = await authenticated_client.get("/api/publications/current")
    assert response.status_code == 200
    data = response.json()
    assert data[0]["id"] == user.publ_id


@pytest.mark.asyncio
async def test_get_current_publication_empty_queue(
    authenticated_client_user2: AsyncClient,
    seed_data: dict,
) -> None:
    response = await authenticated_client_user2.get("/api/publications/current")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0


# ========== Complete Tests ==========


@pytest.mark.asyncio
async def test_complete_full_logs_action(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: dict,
) -> None:
    user = seed_data["users"][0]
    publ_id = seed_data["publs"][0].id

    async with session_maker() as session:
        stmt = select(User).where(User.user_id == user.user_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.items = f"{publ_id}|{seed_data['publs'][1].id}"
            await session.commit()

    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204
    async with session_maker() as session:
        stmt = select(Action).where(Action.action == "publ_end_full")
        result = await session.execute(stmt)
        action = result.scalar_one_or_none()
        assert action is not None
        assert action.object == str(publ_id)


@pytest.mark.asyncio
async def test_complete_wrong_publ_id(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    # Use publ_id that doesn't belong to user (publs[1] is not assigned to user)
    response = await authenticated_client.post(
        f"/api/publications/{seed_data['publs'][1].id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_complete_queue_advancement(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: dict,
) -> None:
    user = seed_data["users"][0]
    publ1_id = seed_data["publs"][0].id
    publ2_id = seed_data["publs"][1].id

    async with session_maker() as session:
        publ3 = Publication(id=random.randint(10000, 99999), name="third")
        session.add(publ3)
        await session.flush()

        stmt = select(User).where(User.user_id == user.user_id)
        result = await session.execute(stmt)
        user = result.scalar_one()

        user.items = f"{publ2_id}|{publ3.id}"
        await session.commit()

    response = await authenticated_client.post(
        f"/api/publications/{publ1_id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Complete second publication, should get third
    response = await authenticated_client.post(
        f"/api/publications/{publ2_id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Complete third publication, queue should be empty
    response = await authenticated_client.post(
        f"/api/publications/{publ3.id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    response = await authenticated_client.post(
        f"/api/publications/{publ3.id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_complete_ural_logs_publ_end_ural(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: dict,
) -> None:
    publ_id = seed_data["publs"][0].id
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/complete",
        json={"processing_level": "ural"},
    )

    assert response.status_code == 204
    async with session_maker() as session:
        stmt = select(Action).where(Action.action == "publ_end_ural")
        result = await session.execute(stmt)
        action = result.scalar_one_or_none()
        assert action is not None


@pytest.mark.asyncio
async def test_complete_invalid_level(
    authenticated_client: AsyncClient,
) -> None:
    response = await authenticated_client.post(
        "/api/publications/1/complete",
        json={"processing_level": "invalid"},
    )
    assert response.status_code == 422


# ========== Metadata Tests ==========


@pytest.mark.asyncio
async def test_metadata_success(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    publ_id = seed_data["publs"][0].id
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/metadata",
        json={"urals_scope": "test_scope", "material_status": "test_status"},
    )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_metadata_404(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    response = await authenticated_client.post(
        "/api/publications/999/metadata",
        json={"urals_scope": "test"},
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_metadata_after_completion_returns_403(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    publ_id = seed_data["publs"][0].id
    # First complete the publication
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Try to add metadata after completion
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/metadata",
        json={"urals_scope": "ural", "material_status": "complete"},
    )
    assert response.status_code == 403
    assert response.json()["error"] == "PUBL_FORBIDDEN"


@pytest.mark.asyncio
async def test_metadata_partial_update(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    publ_id = seed_data["publs"][0].id
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/metadata",
        json={"urals_scope": "ural"},
    )
    assert response.status_code == 204


# ========== Comments Tests ==========


@pytest.mark.asyncio
async def test_comment_after_completion_returns_403(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    publ_id = seed_data["publs"][0].id
    # First complete the publication
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Try to add comment after completion
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/comments",
        json={"comment": "This is a test comment with enough length"},
    )
    assert response.status_code == 403
    assert response.json()["error"] == "PUBL_FORBIDDEN"


@pytest.mark.asyncio
async def test_comment_success(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    publ_id = seed_data["publs"][0].id
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/comments",
        json={"comment": "This is a test comment with enough length"},
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_comment_too_short(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    publ_id = seed_data["publs"][0].id
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/comments",
        json={"comment": "short"},
    )
    assert response.status_code == 422
