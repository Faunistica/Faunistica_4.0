from collections.abc import Callable
from datetime import datetime
from uuid import uuid4

import pytest
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import Action, EventRecord, User
from core.security import get_password_hash
from service.milestone import check_and_log_milestone


async def _create_user(session: AsyncSession, user_id: int, username: str) -> User:
    user = User(
        user_id=user_id,
        name=username,
        tlg_name=username,
        tlg_username=username,
        hash=get_password_hash("password"),
        items="1",
    )
    session.add(user)
    await session.flush()
    return user


async def _seed_records(
    session: AsyncSession,
    user_id: int,
    count: int,
) -> None:
    for _ in range(count):
        record = EventRecord(
            id=uuid4(),
            user_id=user_id,
            type="rec_ok",
            genus="Testus",
            latitude=55.5,
            longitude=37.5,
            created_at=datetime.now(),
        )
        session.add(record)
    await session.commit()


@pytest.mark.asyncio
async def test_fau50_detected(
    session_maker: Callable[[], AsyncSession],
) -> None:
    async with session_maker() as session:
        user = await _create_user(session, 1, "testuser")
        await session.commit()

        await _seed_records(session, user.user_id, 49)

        fiftieth = EventRecord(
            id=uuid4(),
            user_id=user.user_id,
            type="rec_ok",
            genus="Testus",
            latitude=55.5,
            longitude=37.5,
            created_at=datetime.now(),
        )
        session.add(fiftieth)
        await session.commit()

        result = await check_and_log_milestone(session, user.user_id, fiftieth)

        assert result is not None
        assert result.user_id == user.user_id
        assert result.milestone == 50

        stmt = select(Action).where(
            Action.user_id == user.user_id,
            Action.action == "fau_50",
        )
        action = await session.execute(stmt)
        assert action.scalar_one_or_none() is not None

        await _seed_records(session, user.user_id, 49)

        hundredth = EventRecord(
            id=uuid4(),
            user_id=user.user_id,
            type="rec_ok",
            genus="Testus",
            latitude=55.5,
            longitude=37.5,
            created_at=datetime.now(),
        )
        session.add(hundredth)
        await session.commit()

        result = await check_and_log_milestone(session, user.user_id, hundredth)

        assert result is not None
        assert result.user_id == user.user_id
        assert result.milestone == 100

        stmt = (
            select(Action)
            .where(
                Action.user_id == user.user_id,
                Action.action == "fau_50",
            )
            .order_by(desc(Action.datetime))
            .limit(1)
        )
        action = await session.execute(stmt)
        result = action.scalar_one_or_none()
        assert result is not None
        assert result.object == "100"


@pytest.mark.asyncio
async def test_fau50_not_duplicated(
    session_maker: Callable[[], AsyncSession],
) -> None:
    async with session_maker() as session:
        user = await _create_user(session, 1, "testuser")
        await session.commit()

        existing_action = Action(
            user_id=user.user_id,
            action="fau_50",
            object="50",
            datetime=datetime.now(),
        )
        session.add(existing_action)
        await session.commit()

        new_record = EventRecord(
            id=uuid4(),
            user_id=user.user_id,
            type="rec_ok",
            genus="Testus",
            latitude=55.5,
            longitude=37.5,
            created_at=datetime.now(),
        )
        session.add(new_record)
        await session.commit()

        result = await check_and_log_milestone(session, user.user_id, new_record)

        assert result is None


@pytest.mark.asyncio
async def test_fau50_only_at_50(
    session_maker: Callable[[], AsyncSession],
) -> None:
    async with session_maker() as session:
        user = await _create_user(session, 1, "testuser")
        await session.commit()

        await _seed_records(session, user.user_id, 49)

        fiftieth = EventRecord(
            id=uuid4(),
            user_id=user.user_id,
            type="rec_ok",
            genus="Testus",
            latitude=55.5,
            longitude=37.5,
            created_at=datetime.now(),
        )
        session.add(fiftieth)
        await session.commit()

        result = await check_and_log_milestone(session, user.user_id, fiftieth)

        assert result is not None

        stmt = (
            select(func.count())
            .select_from(Action)
            .where(
                Action.user_id == user.user_id,
                Action.action == "fau_50",
            )
        )
        count = await session.execute(stmt)
        assert count.scalar_one() == 1
