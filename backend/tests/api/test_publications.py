import pytest
from httpx import AsyncClient

from core.model import Publication


# ========== Current Publication Tests ==========


@pytest.mark.asyncio
async def test_get_current_publication_with_queue(
    authenticated_client: AsyncClient,
    seed_data: dict,
    test_users: list[dict],
) -> None:
    response = await authenticated_client.get("/api/publications/current")
    assert response.status_code == 200
    data = response.json()
    assert data[0]["id"] == test_users[0]["publ_id"]


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
    auth_tokens: list[dict],
    test_users: list[dict],
    session_maker,
    seed_data: dict,
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

    authenticated_client.cookies.set(
        "access_token", auth_tokens[0]["access_token"]
    )
    response = await authenticated_client.post(
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
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    response = await authenticated_client.post(
        "/api/publications/2/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_complete_queue_advancement(
    authenticated_client: AsyncClient,
    auth_tokens: list[dict],
    test_users: list[dict],
    session_maker,
    seed_data: dict,
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

    authenticated_client.cookies.set(
        "access_token", auth_tokens[0]["access_token"]
    )
    response = await authenticated_client.post(
        "/api/publications/1/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Complete second publication, should get third
    response = await authenticated_client.post(
        "/api/publications/2/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Complete third publication, queue should be empty
    response = await authenticated_client.post(
        "/api/publications/3/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    response = await authenticated_client.post(
        "/api/publications/3/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_complete_ural_logs_publ_end_ural(
    authenticated_client: AsyncClient,
    session_maker,
    seed_data: dict,
) -> None:
    response = await authenticated_client.post(
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
    response = await authenticated_client.post(
        "/api/publications/1/metadata",
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
    # First complete the publication
    response = await authenticated_client.post(
        "/api/publications/1/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Try to add metadata after completion
    response = await authenticated_client.post(
        "/api/publications/1/metadata",
        json={"urals_scope": "ural", "material_status": "complete"},
    )
    assert response.status_code == 403
    assert response.json()["error"] == "PUBL_FORBIDDEN"


@pytest.mark.asyncio
async def test_metadata_partial_update(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    response = await authenticated_client.post(
        "/api/publications/1/metadata",
        json={"urals_scope": "ural"},
    )
    assert response.status_code == 204


# ========== Comments Tests ==========


@pytest.mark.asyncio
async def test_comment_after_completion_returns_403(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    # First complete the publication
    response = await authenticated_client.post(
        "/api/publications/1/complete",
        json={"processing_level": "full"},
    )
    assert response.status_code == 204

    # Try to add comment after completion
    response = await authenticated_client.post(
        "/api/publications/1/comments",
        json={"comment": "This is a test comment with enough length"},
    )
    assert response.status_code == 403
    assert response.json()["error"] == "PUBL_FORBIDDEN"


@pytest.mark.asyncio
async def test_comment_success(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    response = await authenticated_client.post(
        "/api/publications/1/comments",
        json={"comment": "This is a test comment with enough length"},
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_comment_too_short(
    authenticated_client: AsyncClient,
    seed_data: dict,
) -> None:
    response = await authenticated_client.post(
        "/api/publications/1/comments",
        json={"comment": "short"},
    )
    assert response.status_code == 422
