import random
from uuid import uuid4

import pytest
from conftest import SeedData
from httpx import AsyncClient
from sqlalchemy import select

from core.enums import RecordType
from core.model import Action, EventRecord, Publication, User

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
    publ_id = int(
        seed_data["users"][0].items.split("|")[0]
    )  # First (interactable) publication
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


# ========== Submit Tests ==========


@pytest.mark.asyncio
async def test_submit_success(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: SeedData,
) -> None:
    """Submit with all optional fields -> 204, actions logged, queue advanced."""
    user = seed_data["users"][0]
    publ_id = seed_data["publs"][0].publ_id

    async with session_maker() as session:
        stmt = select(User).where(User.user_id == user.user_id)
        result = await session.execute(stmt)
        user = result.scalar_one()
        user.items = f"{publ_id}|{seed_data['publs'][1].publ_id}"
        await session.commit()

    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/submit",
        json={
            "processing_level": "full",
            "urals_scope": "yes",
            "material_status": "no",
            "comment": "All records processed",
        },
    )
    assert response.status_code == 204

    async with session_maker() as session:
        stmt = select(Action).where(Action.action == "publ_end_full")
        result = await session.execute(stmt)
        action = result.scalar_one_or_none()
        assert action is not None
        assert action.object == str(publ_id)

        stmt = select(Action).where(Action.action == "publ_rem_json")
        result = await session.execute(stmt)
        assert result.scalar_one_or_none() is not None

        stmt = select(Action).where(Action.action == "publ_rem")
        result = await session.execute(stmt)
        assert result.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_submit_minimal(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: SeedData,
) -> None:
    """Submit with only processing_level (no optional fields) -> 204."""
    publ_id = seed_data["publs"][0].publ_id

    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/submit",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    async with session_maker() as session:
        stmt = select(Action).where(Action.action == "publ_end_full")
        result = await session.execute(stmt)
        assert result.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_submit_advances_queue(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: SeedData,
) -> None:
    """_advance_queue: submitting removes publ from queue, advances to next."""
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
        user_db = result.scalar_one()
        user_db.items = f"{publ1_id}|{publ2_id}|{publ3.publ_id}"
        await session.commit()

    # Submit first -> advances to publ2
    response = await authenticated_client.post(
        f"/api/publications/{publ1_id}/submit",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Submit second -> advances to publ3
    response = await authenticated_client.post(
        f"/api/publications/{publ2_id}/submit",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Submit third -> queue empty
    response = await authenticated_client.post(
        f"/api/publications/{publ3.publ_id}/submit",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Queue empty, submitting again should fail
    response = await authenticated_client.post(
        f"/api/publications/{publ3.publ_id}/submit",
        json={"processing_level": "full"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_submit_ural_logs_publ_end_ural(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: dict,
) -> None:
    """_advance_queue: ural level logs publ_end_ural."""
    publ_id = seed_data["publs"][0].publ_id
    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/submit",
        json={"processing_level": "ural"},
    )
    assert response.status_code == 204

    async with session_maker() as session:
        stmt = select(Action).where(Action.action == "publ_end_ural")
        result = await session.execute(stmt)
        assert result.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_submit_invalid_level(
    authenticated_client: AsyncClient,
) -> None:
    """Submit with invalid processing_level -> 422."""
    response = await authenticated_client.post(
        "/api/publications/1/submit",
        json={"processing_level": "invalid"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_submit_wrong_publ_id(
    authenticated_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    """Submit with non-interactable publ_id -> 403."""
    response = await authenticated_client.post(
        f"/api/publications/{seed_data['publs'][1].publ_id}/submit",
        json={"processing_level": "full"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_submit_empty_queue(
    authenticated_client_user2: AsyncClient,
    seed_data: SeedData,
) -> None:
    """User with empty queue submitting -> 403."""
    publ_id = seed_data["publs"][0].publ_id
    response = await authenticated_client_user2.post(
        f"/api/publications/{publ_id}/submit",
        json={"processing_level": "full"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_submit_cover_incremented(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: SeedData,
) -> None:
    """_advance_queue: full/ural increments publs.cover."""
    publ_id = seed_data["publs"][0].publ_id

    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/submit",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    async with session_maker() as session:
        stmt = select(Publication).where(Publication.publ_id == publ_id)
        result = await session.execute(stmt)
        publ = result.scalar_one()
        assert publ.cover == 1


@pytest.mark.asyncio
async def test_submit_cover_not_incremented_for_skip(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: SeedData,
) -> None:
    """_advance_queue: skip/part does NOT increment publs.cover."""
    publ_id = seed_data["publs"][0].publ_id

    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/submit",
        json={"processing_level": "skip"},
    )
    assert response.status_code == 204

    async with session_maker() as session:
        stmt = select(Publication).where(Publication.publ_id == publ_id)
        result = await session.execute(stmt)
        publ = result.scalar_one()
        assert publ.cover == 0


@pytest.mark.asyncio
async def test_submit_unsubmitted_records(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: SeedData,
) -> None:
    """Submit with draft CHECK_OK records -> 409 + draft_record_ids."""
    publ_id = seed_data["publs"][0].publ_id
    user = seed_data["users"][0]

    async with session_maker() as session:
        draft = EventRecord(
            id=uuid4(),
            user_id=user.user_id,
            publ_id=publ_id,
            type=RecordType.CHECK_OK,
        )
        session.add(draft)
        await session.commit()
        draft_id = str(draft.id)

    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/submit",
        json={"processing_level": "full"},
    )
    assert response.status_code == 409
    data = response.json()
    assert data["error"] == "UNSUBMITTED_RECORDS"
    assert draft_id in data["draft_record_ids"]


@pytest.mark.asyncio
async def test_submit_unsubmitted_records_null_type(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: SeedData,
) -> None:
    """Submit with record having type=None -> 409."""
    publ_id = seed_data["publs"][0].publ_id
    user = seed_data["users"][0]

    async with session_maker() as session:
        draft = EventRecord(
            id=uuid4(),
            user_id=user.user_id,
            publ_id=publ_id,
            type=None,
        )
        session.add(draft)
        await session.commit()
        draft_id = str(draft.id)

    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/submit",
        json={"processing_level": "full"},
    )
    assert response.status_code == 409
    data = response.json()
    assert draft_id in data["draft_record_ids"]


@pytest.mark.asyncio
async def test_submit_unsubmitted_records_check_fail(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: SeedData,
) -> None:
    """Submit with CHECK_FAIL record -> 409."""
    publ_id = seed_data["publs"][0].publ_id
    user = seed_data["users"][0]

    async with session_maker() as session:
        draft = EventRecord(
            id=uuid4(),
            user_id=user.user_id,
            publ_id=publ_id,
            type=RecordType.CHECK_FAIL,
        )
        session.add(draft)
        await session.commit()
        draft_id = str(draft.id)

    response = await authenticated_client.post(
        f"/api/publications/{publ_id}/submit",
        json={"processing_level": "full"},
    )
    assert response.status_code == 409
    data = response.json()
    assert draft_id in data["draft_record_ids"]


# ========== Drafts Tests ==========


@pytest.mark.asyncio
async def test_get_drafts_ok(
    authenticated_client: AsyncClient,
    seed_data: SeedData,
) -> None:
    """GET /drafts returns empty list when no drafts."""
    publ_id = seed_data["publs"][0].publ_id
    response = await authenticated_client.get(
        f"/api/publications/{publ_id}/drafts",
    )
    assert response.status_code == 200
    data = response.json()
    assert data["draft_record_ids"] == []


@pytest.mark.asyncio
async def test_get_drafts_drafts(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: SeedData,
) -> None:
    """GET /drafts returns draft IDs when drafts exist."""
    publ_id = seed_data["publs"][0].publ_id
    user = seed_data["users"][0]

    async with session_maker() as session:
        draft = EventRecord(
            id=uuid4(),
            user_id=user.user_id,
            publ_id=publ_id,
            type=RecordType.CHECK_OK,
        )
        session.add(draft)
        await session.commit()
        draft_id = str(draft.id)

    response = await authenticated_client.get(
        f"/api/publications/{publ_id}/drafts",
    )
    assert response.status_code == 200
    data = response.json()
    assert draft_id in data["draft_record_ids"]


@pytest.mark.asyncio
async def test_get_drafts_no_access(
    authenticated_client_user2: AsyncClient,
    seed_data: SeedData,
) -> None:
    """GET /drafts returns 403 for user without access."""
    publ_id = seed_data["publs"][0].publ_id
    response = await authenticated_client_user2.get(
        f"/api/publications/{publ_id}/drafts",
    )
    assert response.status_code == 403
