import random

import pytest
from conftest import SeedData
from httpx import AsyncClient
from sqlalchemy import select

from core.model import Action, Publication, User

# ========== Current Publication Tests ==========


@pytest.mark.asyncio
async def test_get_current_publication_with_queue(
    authenticated_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    user = seed_data["users"][0]

    response = await authenticated_client.get("/api/publications/current")
    assert response.status_code == 200
    data = response.json()
    assert data[0]["publ_id"] == int(user.items.split("|")[0])


@pytest.mark.asyncio
async def test_get_current_publication_empty_queue(
    authenticated_client_user2: AsyncClient,
) -> None:
    response = await authenticated_client_user2.get("/api/publications/current")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0


@pytest.mark.asyncio
async def test_get_publication_by_id(
    authenticated_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    """GET /api/publications/{publ_id} returns publication when user has access."""
    publ_id = int(seed_data["users"][0].items.split("|")[0])  # First (interactable) publication
    response = await authenticated_client.get(f"/api/publications/{publ_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["publ_id"] == publ_id


@pytest.mark.asyncio
async def test_get_publication_not_found(
    authenticated_client: AsyncClient,
) -> None:
    """GET /api/publications/{publ_id} returns 404 for non-existent publication."""
    response = await authenticated_client.get("/api/publications/99999")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "PUBL_NOT_FOUND"


@pytest.mark.asyncio
async def test_get_publication_forbidden_not_in_queue(
    authenticated_client_user2: AsyncClient,
    seed_data: SeedData,
) -> None:
    """GET /api/publications/{publ_id} returns 403 when publication not in user's queue."""
    publ_id = seed_data["publs"][0].publ_id  # User2 has no publications
    response = await authenticated_client_user2.get(f"/api/publications/{publ_id}")
    assert response.status_code == 403
    data = response.json()
    assert data["error"] == "NO_PUBL"


@pytest.mark.asyncio
async def test_get_publication_forbidden_not_interactable(
    authenticated_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    """GET /api/publications/{publ_id} returns 403 for non-interactable (second in queue)."""
    # User1 has items="publ1|publ2", with INTERACTABLE_QUEUE_COUNT=1, only publ1 is interactable
    user_items = seed_data["users"][0].items.split("|")
    assert len(user_items) >= 2, "Need at least 2 publications in queue"
    second_publ_id = int(user_items[1])  # Second publication - not interactable
    response = await authenticated_client.get(f"/api/publications/{second_publ_id}")
    assert response.status_code == 403
    data = response.json()
    assert data["error"] == "PUBL_FORBIDDEN"


# ========== Interactable Flag Tests ==========


@pytest.mark.asyncio
async def test_get_current_interactable_true(
    authenticated_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    """Current (first) publication has interactable: true."""
    response = await authenticated_client.get("/api/publications/current")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["interactable"] is True


@pytest.mark.asyncio
async def test_get_current_queue_interactable_flags(
    authenticated_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    """With list_all=true, first item is interactable, others are not."""
    user_items = seed_data["users"][0].items.split("|")
    assert len(user_items) >= 2, "Need at least 2 publications in queue"

    response = await authenticated_client.get("/api/publications/current?list_all=true")
    assert response.status_code == 200
    data = response.json()

    assert len(data) == len(user_items)
    # First publication (index 0) should be interactable
    assert data[0]["interactable"] is True
    # Remaining publications should not be interactable
    for i in range(1, len(data)):
        assert data[i]["interactable"] is False


# ========== Complete Tests ==========


@pytest.mark.asyncio
async def test_complete_full_logs_action(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: SeedData,
) -> None:
    user = seed_data["users"][0]
    publ_id = seed_data["publs"][0].publ_id

    async with session_maker() as session:
        stmt = select(User).where(User.user_id == user.user_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.items = f"{publ_id}|{seed_data['publs'][1].publ_id}"
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
        f"/api/publications/{seed_data['publs'][1].publ_id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_complete_queue_advancement(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: SeedData,
) -> None:
    user = seed_data["users"][0]
    publ1_id = seed_data["publs"][0].publ_id
    publ2_id = seed_data["publs"][1].publ_id

    async with session_maker() as session:
        publ3 = Publication(
            publ_id=random.randint(10000, 99999),
            name="third",
            type="A",
            year=2000,
            language="rus",
            ural=1,
        )
        session.add(publ3)
        await session.flush()

        stmt = select(User).where(User.user_id == user.user_id)
        result = await session.execute(stmt)
        user = result.scalar_one()

        user.items = f"{publ1_id}|{publ2_id}|{publ3.publ_id}"
        await session.commit()

    # Complete first publication (was items[0]), queue advances to publ2
    response = await authenticated_client.post(
        f"/api/publications/{publ1_id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Complete second publication (now items[0]), queue advances to publ3
    response = await authenticated_client.post(
        f"/api/publications/{publ2_id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Complete third publication, queue should be empty
    response = await authenticated_client.post(
        f"/api/publications/{publ3.publ_id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Queue is empty, completing again should fail
    response = await authenticated_client.post(
        f"/api/publications/{publ3.publ_id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_complete_ural_logs_publ_end_ural(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: dict,
) -> None:
    publ_id = seed_data["publs"][0].publ_id
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
async def test_metadata_partial_update(
    authenticated_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    publ_id = seed_data["publs"][0].publ_id
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/metadata",
        json={"urals_scope": "urals_only"},
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_metadata_404(
    authenticated_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    response = await authenticated_client.post(
        "/api/publications/999/metadata",
        json={"urals_scope": "urals_only"},
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_metadata_after_completion_returns_403(
    authenticated_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    publ_id = seed_data["publs"][0].publ_id
    # First complete the publication
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Try to add metadata after completion
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/metadata",
        json={"urals_scope": "urals_only", "material_status": "present_rec"},
    )
    assert response.status_code == 403
    assert response.json()["error"] == "PUBL_FORBIDDEN"


# ========== Comments Tests ==========


@pytest.mark.asyncio
async def test_comment_after_completion_returns_403(
    authenticated_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    publ_id = seed_data["publs"][0].publ_id
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/metadata",
        json={"urals_scope": "urals_plus", "material_status": "present_rec"},
    )
    assert response.status_code == 403
    assert response.json()["error"] == "PUBL_FORBIDDEN"


@pytest.mark.asyncio
async def test_comment_success(
    authenticated_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    publ_id = seed_data["publs"][0].publ_id
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
    publ_id = seed_data["publs"][0].publ_id
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/comments",
        json={"comment": "short"},
    )
    assert response.status_code == 422
