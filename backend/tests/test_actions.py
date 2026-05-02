from datetime import datetime

import pytest
from sqlalchemy import select

from core.model import Action
from schema.common import ProcessingLevel
from service.actions import ActionService


@pytest.mark.asyncio
async def test_log_win(session_maker, test_users, seed_data) -> None:
    async with session_maker() as session:
        service = ActionService(session)
        await service.log_win(
            user_id=test_users[0]["user_id"],
            picfile="pic.png",
            message="winner!",
            ip="127.0.0.1",
        )
        await session.commit()

        result = await session.execute(select(Action).where(Action.action == "fau_win"))
        action = result.scalar_one_or_none()
        assert action is not None
        assert action.user_id == test_users[0]["user_id"]
        assert action.object == "pic.png|winner!"


@pytest.mark.asyncio
async def test_log_publ_complete(session_maker, test_users, seed_data) -> None:
    async with session_maker() as session:
        service = ActionService(session)
        await service.log_publ_complete(
            user_id=test_users[0]["user_id"],
            level=ProcessingLevel.FULL,
            publ_id=123,
            ip="127.0.0.1",
        )
        await session.commit()

        result = await session.execute(
            select(Action).where(Action.action == "publ_end_full")
        )
        action = result.scalar_one_or_none()
        assert action is not None
        assert action.user_id == test_users[0]["user_id"]
        assert action.object == "123"


@pytest.mark.asyncio
async def test_log_publ_metadata(session_maker, test_users, seed_data) -> None:
    async with session_maker() as session:
        service = ActionService(session)
        await service.log_publ_metadata(
            user_id=test_users[0]["user_id"],
            publ_id=123,
            urals_scope="ural",
            material_status="complete",
            ip="127.0.0.1",
        )
        await session.commit()

        result = await session.execute(
            select(Action).where(Action.action == "publ_rem_json")
        )
        action = result.scalar_one_or_none()
        assert action is not None
        assert action.user_id == test_users[0]["user_id"]
        # Check JSON contains expected keys
        import json
        obj = json.loads(action.object)
        assert "publ_id" in obj
        assert "reg" in obj
        assert "mat" in obj


@pytest.mark.asyncio
async def test_log_publ_comment(session_maker, test_users, seed_data) -> None:
    async with session_maker() as session:
        service = ActionService(session)
        await service.log_publ_comment(
            user_id=test_users[0]["user_id"],
            publ_id=123,
            comment="Great work!",
            ip="127.0.0.1",
        )
        await session.commit()

        result = await session.execute(
            select(Action).where(Action.action == "publ_rem")
        )
        action = result.scalar_one_or_none()
        assert action is not None
        assert action.object == "123_comm:Great work!"


@pytest.mark.asyncio
async def test_log_login(session_maker, test_users, seed_data) -> None:
    async with session_maker() as session:
        service = ActionService(session)
        await service.log_login(
            user_id=test_users[0]["user_id"],
            ip="127.0.0.1",
        )
        await session.commit()

        result = await session.execute(
            select(Action).where(Action.action == "fau_login")
        )
        action = result.scalar_one_or_none()
        assert action is not None
        assert action.user_id == test_users[0]["user_id"]


@pytest.mark.asyncio
async def test_log_logout(session_maker, test_users, seed_data) -> None:
    async with session_maker() as session:
        service = ActionService(session)
        await service.log_logout(
            user_id=test_users[0]["user_id"],
            ip="127.0.0.1",
        )
        await session.commit()

        result = await session.execute(
            select(Action).where(Action.action == "fau_logout")
        )
        action = result.scalar_one_or_none()
        assert action is not None
        assert action.user_id == test_users[0]["user_id"]


@pytest.mark.asyncio
async def test_log_bot_auth(session_maker, test_users, seed_data) -> None:
    async with session_maker() as session:
        service = ActionService(session)
        await service.log_bot_auth(
            user_id=test_users[0]["user_id"],
            status="success",
            ip="127.0.0.1",
        )
        await session.commit()

        result = await session.execute(
            select(Action).where(Action.action == "bot_auth")
        )
        action = result.scalar_one_or_none()
        assert action is not None
        assert action.object == "success"


@pytest.mark.asyncio
async def test_log_bot_rename(session_maker, test_users, seed_data) -> None:
    async with session_maker() as session:
        service = ActionService(session)
        await service.log_bot_rename(
            user_id=test_users[0]["user_id"],
            old="oldname",
            new="newname",
            ip="127.0.0.1",
        )
        await session.commit()

        result = await session.execute(
            select(Action).where(Action.action == "bot_rename")
        )
        action = result.scalar_one_or_none()
        assert action is not None
        assert action.object == "oldname -> newname"


@pytest.mark.asyncio
async def test_log_milestone(session_maker, test_users, seed_data) -> None:
    async with session_maker() as session:
        service = ActionService(session)
        await service.log_milestone(
            user_id=test_users[0]["user_id"],
            milestone=100,
            ip="127.0.0.1",
        )
        await session.commit()

        result = await session.execute(select(Action).where(Action.action == "fau_50"))
        action = result.scalar_one_or_none()
        assert action is not None
        assert action.object == "100"


@pytest.mark.asyncio
async def test_get_winner_info_no_action(session_maker, test_users) -> None:
    async with session_maker() as session:
        service = ActionService(session)
        info = await service.get_winner_info(test_users[0]["user_id"])
        assert info is None


@pytest.mark.asyncio
async def test_get_winner_info_no_object(session_maker, test_users, seed_data) -> None:
    user_id = test_users[0]["user_id"]

    async with session_maker() as session:
        action = Action(
            user_id=user_id,
            action="fau_win",
            object=None,
            datetime=datetime.strptime("Jun 1 2005", "%b %d %Y"),
        )
        session.add(action)
        await session.commit()

        service = ActionService(session)
        info = await service.get_winner_info(user_id)
        assert info is None


@pytest.mark.asyncio
async def test_get_last_milestone(session_maker, test_users, seed_data) -> None:
    user_id = test_users[0]["user_id"]

    async with session_maker() as session:
        action = Action(
            user_id=user_id,
            action="fau_50",
            object="100",
            datetime=datetime.now(),
        )
        session.add(action)
        await session.commit()

        service = ActionService(session)
        result = await service.get_last_milestone(user_id)
        assert result is not None
        assert result.milestone == 100


@pytest.mark.asyncio
async def test_get_last_milestone_none(session_maker, test_users, seed_data) -> None:
    async with session_maker() as session:
        service = ActionService(session)
        result = await service.get_last_milestone(test_users[0]["user_id"])
        assert result is None
