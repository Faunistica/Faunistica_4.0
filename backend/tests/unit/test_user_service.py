from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from aiogram import Bot
from aiogram.fsm.context import FSMContext
from aiogram.fsm.storage.base import StorageKey
from aiogram.fsm.storage.memory import MemoryStorage
from sqlalchemy.ext.asyncio import AsyncSession

from core.enums import UserState
from core.exceptions import ExpectationError, MsgErr, Ok
from core.model import User
from service.actions import ActionService
from service.user import (
    FlowOk,
    FlowResult,
    UserService,
)


@pytest.fixture
def mock_session() -> MagicMock:
    return MagicMock(spec=AsyncSession)


@pytest.fixture
def mock_action_service() -> MagicMock:
    return MagicMock(spec=ActionService)


@pytest.fixture
def mock_bot() -> MagicMock:
    return MagicMock(spec=Bot)


@pytest.fixture
def user_service(
    mock_session: MagicMock, mock_bot: MagicMock, mock_action_service: MagicMock
) -> UserService:
    return UserService(mock_session, mock_bot, mock_action_service)


@pytest.fixture
def fsm_context() -> FSMContext:
    storage = MemoryStorage()
    return FSMContext(storage=storage, key=StorageKey(bot_id=1, chat_id=1, user_id=1))


class TestCheckCommandAllowed:
    @pytest.fixture(autouse=True, scope="function")
    def setup_mocks(self):
        with patch(
            "service.user.get_user", new_callable=AsyncMock
        ) as self.mock_get_user:
            yield

    @pytest.mark.asyncio
    async def test_registered_user(self, user_service: UserService) -> None:
        self.mock_get_user.return_value = User(
            user_id=12345, reg_stat=UserState.REG_COMPLETED
        )
        result = await user_service.check_commands_allowed(user_id=12345)
        assert isinstance(result, Ok)

    @pytest.mark.asyncio
    async def test_unregistered_user(self, user_service: UserService) -> None:
        self.mock_get_user.return_value = None
        result = await user_service.check_commands_allowed(user_id=54321)
        assert isinstance(result, MsgErr)

    @pytest.mark.asyncio
    async def test_user_in_registration(self, user_service: UserService) -> None:
        self.mock_get_user.return_value = User(
            user_id=99999, reg_stat=UserState.REG_AGREEMENT
        )
        result = await user_service.check_commands_allowed(user_id=99999)
        assert isinstance(result, MsgErr)

    @pytest.mark.asyncio
    async def test_user_in_survey(self, user_service: UserService) -> None:
        self.mock_get_user.return_value = User(
            user_id=88888, reg_stat=UserState.SURVEY_AGE
        )
        result = await user_service.check_commands_allowed(user_id=88888)
        assert isinstance(result, MsgErr)

    @pytest.mark.asyncio
    async def test_nonexistent_user(self, user_service: UserService) -> None:
        self.mock_get_user.return_value = None
        result = await user_service.check_commands_allowed(user_id=999999)
        assert isinstance(result, MsgErr)


class TestSurveyFlow:
    @pytest.fixture(autouse=True, scope="function")
    def setup_mocks(self):
        with patch(
            "service.user.get_user", new_callable=AsyncMock
        ) as self.mock_get_user:
            yield

    @pytest.mark.asyncio
    async def test_backwards_compat_prod_reg_stat_values(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test users with reg_stat 7, 14-20, 22 are handled properly."""
        for reg_stat in [
            UserState.SUPPORT,  # 7
            UserState.SURVEY_AGE,
            UserState.SURVEY_PREFERENCES,
            UserState.SURVEY_LANGUAGE,
            UserState.SURVEY_RATING,
            UserState.SURVEY_REGION,
            UserState.SURVEY_EMAIL,
            UserState.SURVEY_SEX,
            UserState.RENAME,  # 22
        ]:
            self.mock_get_user.return_value = User(
                user_id=99999,
                reg_stat=reg_stat,
                age=None,
                lng=None,
                comm=None,
                sex=None,
                rating=None,
                email=None,
                region=None,
            )

            # User should be blocked from starting new survey while in survey
            result = await user_service.check_commands_allowed(user_id=99999)
            assert isinstance(result, MsgErr)


class TestBackwardsCompatRegStat:
    """Test backwards compatibility with production reg_stat values 7 and 22."""

    @pytest.fixture(autouse=True, scope="function")
    def setup_mocks(self):
        with patch(
            "service.user.get_user", new_callable=AsyncMock
        ) as self.mock_get_user:
            yield

    @pytest.mark.asyncio
    async def test_backwards_compat_prod_reg_stat_values(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test users with reg_stat 7 (SUPPORT) and 22 (RENAME) are handled properly."""
        for reg_stat in [UserState.SUPPORT, UserState.RENAME]:
            self.mock_get_user.return_value = User(
                user_id=99999,
                reg_stat=reg_stat,
                name="Test User",
            )

            # User should be blocked from starting new commands while in support/rename
            result = await user_service.check_commands_allowed(user_id=99999)
            assert isinstance(result, MsgErr)
