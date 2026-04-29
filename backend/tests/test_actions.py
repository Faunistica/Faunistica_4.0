import pytest
from sqlalchemy import select

from core.model import Action
from service.actions import ActionService


@pytest.mark.asyncio
async def test_save_action(db_session_maker, test_users, seed_data) -> None:
    async with db_session_maker() as session:
        service = ActionService(session)
        await service.save_action(
            user_id=test_users[0]["user_id"],
            action_type="fau_win",
            object="pic.png|winner!",
            ip="127.0.0.1",
        )

        result = await session.execute(select(Action).where(Action.action == "fau_win"))
        action = result.scalar_one_or_none()
        assert action is not None
        assert action.user_id == test_users[0]["user_id"]
        assert action.object == "pic.png|winner!"
        await session.close()


@pytest.mark.asyncio
async def test_get_winner_info(db_session_maker, test_users, seed_data) -> None:
    user_id = test_users[0]["user_id"]
    async with db_session_maker() as session:
        action = Action(
            user_id=user_id,
            action="fau_win",
            object="trophy.png|You won!",
            datetime=None,
        )
        session.add(action)
        await session.commit()

        service = ActionService(session)
        info = await service.get_winner_info(user_id)
        assert info == {"picfile": "trophy.png", "message": "You won!"}
        await session.close()


@pytest.mark.asyncio
async def test_get_winner_info_no_action(db_session_maker, test_users) -> None:
    async with db_session_maker() as session:
        service = ActionService(session)
        info = await service.get_winner_info(test_users[0]["user_id"])
        assert info is None
        await session.close()


@pytest.mark.asyncio
async def test_get_winner_info_no_object(
    db_session_maker, test_users, seed_data
) -> None:
    user_id = test_users[0]["user_id"]
    async with db_session_maker() as session:
        action = Action(
            user_id=user_id,
            action="fau_win",
            object=None,
            datetime=None,
        )
        session.add(action)
        await session.commit()

        service = ActionService(session)
        info = await service.get_winner_info(user_id)
        assert info is None
        await session.close()


@pytest.mark.asyncio
async def test_get_last_milestone(db_session_maker, test_users, seed_data) -> None:
    from datetime import datetime

    user_id = test_users[0]["user_id"]
    async with db_session_maker() as session:
        action = Action(
            user_id=user_id,
            action="fau_100",
            object=None,
            datetime=datetime.now(),
        )
        session.add(action)
        await session.commit()

        service = ActionService(session)
        result = await service.get_last_milestone(user_id)
        assert result is not None
        milestone_number, _ = result
        assert milestone_number == 100
        await session.close()


@pytest.mark.asyncio
async def test_get_last_milestone_none(db_session_maker, test_users, seed_data) -> None:
    async with db_session_maker() as session:
        service = ActionService(session)
        result = await service.get_last_milestone(test_users[0]["user_id"])
        assert result is None
        await session.close()
