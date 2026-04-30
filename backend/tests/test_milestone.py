import asyncio
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import Action, EventRecord
from service.milestone import detect_milestones


async def _seed_records(
    session: AsyncSession,
    user_id: int,
    count: int,
    publ_id: int = 1,
    base_time: datetime | None = None,
) -> None:
    if base_time is None:
        base_time = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=1)

    for i in range(count):
        record = EventRecord(
            id=uuid4(),
            user_id=user_id,
            publ_id=publ_id,
            type="rec_ok",
            genus="Testus",
            latitude=55.5,
            longitude=37.5,
            created_at=base_time + timedelta(hours=i),
            updated_at=base_time + timedelta(hours=i),
        )
        session.add(record)

    await session.commit()


async def _seed_milestone_action(
    session: AsyncSession,
    user_id: int,
    milestone: int,
    action_time: datetime | None = None,
) -> None:
    if action_time is None:
        action_time = datetime.now(UTC).replace(tzinfo=None)

    action = Action(
        user_id=user_id,
        action=f"fau_{milestone}",
        object=str(milestone),
        datetime=action_time,
    )
    session.add(action)
    await session.commit()


async def _count_fau_actions(session: AsyncSession, user_id: int):
    stmt = text(
        "SELECT COUNT(*) FROM actions WHERE user_id = :uid AND action LIKE 'fau_%0'"
    )
    result = await session.execute(stmt, {"uid": user_id})
    return result.scalar_one()


@pytest.mark.asyncio
async def test_detect_milestone_100(
    session_maker: Callable[[], AsyncSession],
    test_users,
    seed_data,
) -> None:
    user_id = test_users[0]["user_id"]

    async with session_maker() as session:
        await _seed_records(session, user_id, 127)

        new_milestones = await detect_milestones(session)

        assert len(new_milestones) == 1
        assert new_milestones[0]["user_id"] == user_id
        assert new_milestones[0]["milestone"] == 100
        await asyncio.sleep(1000)

        count = await _count_fau_actions(session, user_id)
        assert count == 1

        stmt = text(
            "SELECT object FROM actions WHERE user_id = :uid AND action = 'fau_100'"
        )
        result = await session.execute(stmt, {"uid": user_id})
        assert result.scalar_one() == "100"


@pytest.mark.asyncio
async def test_detect_milestone_50(
    session_maker: Callable[[], AsyncSession],
    test_users,
    seed_data,
) -> None:
    user_id = test_users[0]["user_id"]

    async with session_maker() as session:
        await _seed_records(session, user_id, 60)

        new_milestones = await detect_milestones(session)
        print(new_milestones)

        assert len(new_milestones) == 1
        assert new_milestones[0]["user_id"] == user_id
        assert new_milestones[0]["milestone"] == 50

        stmt = text(
            "SELECT object FROM actions WHERE user_id = :uid AND action = 'fau_50'"
        )
        result = await session.execute(stmt, {"uid": user_id})
        assert result.scalar_one() == "50"

        await _seed_records(session, user_id, 60)

        new_milestones = await detect_milestones(session)
        print(new_milestones)

        assert len(new_milestones) == 1
        assert new_milestones[0]["user_id"] == user_id
        assert new_milestones[0]["milestone"] == 100

        stmt = text(
            "SELECT object FROM actions WHERE user_id = :uid AND action = 'fau_50'"
        )
        result = await session.execute(stmt, {"uid": user_id})
        assert result.scalar_one() == "50"

        await asyncio.sleep(1000)


@pytest.mark.asyncio
async def test_no_new_milestone(
    session_maker: Callable[[], AsyncSession],
    test_users,
    seed_data,
) -> None:
    user_id = test_users[0]["user_id"]
    base_time = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=2)

    async with session_maker() as session:
        await _seed_milestone_action(session, user_id, 50, base_time)

        new_milestones = await detect_milestones(session)

        assert len(new_milestones) == 0

        count = await _count_fau_actions(session, user_id)
        assert count == 1
