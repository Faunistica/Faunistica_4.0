from collections.abc import Callable
from datetime import datetime
from uuid import uuid4

import pytest
from conftest import SeedData
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import Action, EventRecord
from service.actions import ActionService
from service.milestone import check_and_log_milestone


async def _seed_records(
    session: AsyncSession,
    user_id: int,
    publ_id: int,
    count: int,
) -> None:
    for _ in range(count):
        record = EventRecord(
            id=uuid4(),
            user_id=user_id,
            publ_id=publ_id,
            type="rec_ok",
            genus="Testus",
            latitude="55.5",
            longitude="37.5",
            created_at=datetime.now(),
        )
        session.add(record)
    await session.commit()


@pytest.mark.asyncio
async def test_fau50_detected(
    session_maker: Callable[[], AsyncSession],
    seed_data: SeedData,
) -> None:
    async with session_maker() as session:
        action_service = ActionService(session)

        user = seed_data["users"][2]
        publ_id = int(user.items.split("|")[0])
        assert publ_id is not None

        await _seed_records(session, user.user_id, publ_id, 49)

        fiftieth = EventRecord(
            id=uuid4(),
            user_id=user.user_id,
            publ_id=publ_id,
            type="rec_ok",
            genus="Testus",
            latitude="55.5",
            longitude="37.5",
            created_at=datetime.now(),
        )
        session.add(fiftieth)
        await session.commit()

        result = await check_and_log_milestone(
            session, user.user_id, fiftieth, action_service
        )

        assert result is not None
        assert result.user_id == user.user_id
        assert result.milestone == 50

        stmt = select(Action).where(
            Action.user_id == user.user_id,
            Action.action == "fau_50",
        )
        action = await session.execute(stmt)
        assert action.scalar_one_or_none() is not None

        await _seed_records(session, user.user_id, publ_id, 49)

        hundredth = EventRecord(
            id=uuid4(),
            user_id=user.user_id,
            publ_id=publ_id,
            type="rec_ok",
            genus="Testus",
            latitude="55.5",
            longitude="37.5",
            created_at=datetime.now(),
        )
        session.add(hundredth)
        await session.commit()

        result = await check_and_log_milestone(
            session, user.user_id, hundredth, action_service
        )

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
    seed_data: SeedData,
) -> None:
    async with session_maker() as session:
        action_service = ActionService(session)

        user = seed_data["users"][2]
        publ_id = int(user.items.split("|")[0])
        assert publ_id is not None

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
            publ_id=publ_id,
            type="rec_ok",
            genus="Testus",
            latitude="55.5",
            longitude="37.5",
            created_at=datetime.now(),
        )
        session.add(new_record)
        await session.commit()

        result = await check_and_log_milestone(
            session, user.user_id, new_record, action_service
        )

        assert result is None
