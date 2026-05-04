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
    FlowType,
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
        with patch("service.user.get_user_expect", new_callable=AsyncMock) as self.mock_get_user:
            yield

    @pytest.mark.asyncio
    async def test_registered_user(self, user_service: UserService) -> None:
        self.mock_get_user.return_value = User(user_id=12345, reg_stat=UserState.REG_COMPLETED)
        result = await user_service.check_command_allowed(12345)
        assert isinstance(result, Ok)

    @pytest.mark.asyncio
    async def test_unregistered_user(self, user_service: UserService) -> None:
        self.mock_get_user.return_value = User(user_id=54321, reg_stat=UserState.DATA_CLEARED)
        result = await user_service.check_command_allowed(54321)
        assert isinstance(result, MsgErr)

    @pytest.mark.asyncio
    async def test_user_in_registration(self, user_service: UserService) -> None:
        self.mock_get_user.return_value = User(user_id=99999, reg_stat=UserState.REG_AGREEMENT)
        result = await user_service.check_command_allowed(99999)
        assert isinstance(result, MsgErr)

    @pytest.mark.asyncio
    async def test_user_in_survey(self, user_service: UserService) -> None:
        self.mock_get_user.return_value = User(user_id=88888, reg_stat=UserState.SURVEY_AGE)
        result = await user_service.check_command_allowed(88888)
        assert isinstance(result, MsgErr)

    @pytest.mark.asyncio
    async def test_nonexistent_user(self, user_service: UserService) -> None:
        self.mock_get_user.side_effect = ExpectationError("User not found")
        result = await user_service.check_command_allowed(999999)
        assert isinstance(result, MsgErr)


class TestRegistrationFlow:
    @pytest.fixture(autouse=True, scope="function")
    def setup_mocks(self):
        with (
            patch("service.user.get_user_expect", new_callable=AsyncMock) as self.mock_get_user,
            patch("service.user.update_user", new_callable=AsyncMock) as self.mock_update_user,
            patch("service.user.count_users_with_name", new_callable=AsyncMock) as self.mock_count_users,
            patch("service.user.get_publications_for_language", new_callable=AsyncMock) as self.mock_get_pubs,
        ):
            yield

    def _assert_flow_ok(self, result: FlowResult, next_state: UserState | None = None) -> FlowOk:
        assert isinstance(result, FlowOk)
        if next_state is not None:
            assert result.next_state == next_state
        return result

    def _assert_msg_err(self, result: FlowResult, error_substring: str | None = None) -> MsgErr:
        assert isinstance(result, MsgErr)
        if error_substring is not None:
            assert error_substring in result.error
        return result

    @pytest.mark.asyncio
    async def test_start_registration(self, user_service: UserService, fsm_context: FSMContext) -> None:
        result = await user_service.start_flow(
            user_id=11111, flow_type=FlowType.REGISTRATION, state=fsm_context
        )
        self._assert_flow_ok(result, UserState.REG_AGREEMENT)

    @pytest.mark.asyncio
    async def test_handle_agreement_accept(self, user_service: UserService, fsm_context: FSMContext) -> None:
        await fsm_context.set_state(UserState.REG_AGREEMENT.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=22222, input_text="agree", state=fsm_context
        )
        self._assert_flow_ok(result, UserState.REG_NAME)
        self.mock_update_user.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_name_valid(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        self.mock_count_users.return_value = 0
        await fsm_context.set_state(UserState.REG_NAME.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=33333, input_text="John Doe", state=fsm_context
        )
        self._assert_flow_ok(result, UserState.REG_AGE)
        self.mock_update_user.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_name_too_short(self, user_service: UserService, fsm_context: FSMContext) -> None:
        await fsm_context.set_state(UserState.REG_NAME.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=33334, input_text="Jo", state=fsm_context
        )
        self._assert_msg_err(result, "short")
        self.mock_update_user.assert_not_called()

    @pytest.mark.asyncio
    async def test_handle_name_invalid_chars(self, user_service: UserService, fsm_context: FSMContext) -> None:
        await fsm_context.set_state(UserState.REG_NAME.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=33335, input_text="John123", state=fsm_context
        )
        self._assert_msg_err(result, "Invalid characters")
        self.mock_update_user.assert_not_called()

    @pytest.mark.asyncio
    async def test_handle_age_valid(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        await fsm_context.set_state(UserState.REG_AGE.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=44444, input_text="25", state=fsm_context
        )
        self._assert_flow_ok(result, UserState.REG_PREFERENCES)
        self.mock_update_user.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_age_invalid_not_digit(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        await fsm_context.set_state(UserState.REG_AGE.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=44445, input_text="twenty", state=fsm_context
        )
        self._assert_msg_err(result, "number")
        self.mock_update_user.assert_not_called()

    @pytest.mark.asyncio
    async def test_handle_age_too_young(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        await fsm_context.set_state(UserState.REG_AGE.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=44446, input_text="13", state=fsm_context
        )
        self._assert_msg_err(result, "14")
        self.mock_update_user.assert_not_called()

    @pytest.mark.asyncio
    async def test_handle_age_too_old(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        await fsm_context.set_state(UserState.REG_AGE.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=44447, input_text="100", state=fsm_context
        )
        self._assert_msg_err(result, "99")
        self.mock_update_user.assert_not_called()

    @pytest.mark.asyncio
    async def test_handle_preferences(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        await fsm_context.set_state(UserState.REG_PREFERENCES.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=55555, input_text="Biology, Zoology", state=fsm_context
        )
        self._assert_flow_ok(result, UserState.REG_LANGUAGE)
        self.mock_update_user.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_language_valid(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        self.mock_get_pubs.return_value = [1, 2, 3]
        await fsm_context.set_state(UserState.REG_LANGUAGE.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=66666, input_text="1", state=fsm_context
        )
        flow_ok = self._assert_flow_ok(result)
        assert flow_ok.completed is True
        self.mock_update_user.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_language_invalid(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        await fsm_context.set_state(UserState.REG_LANGUAGE.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=66667, input_text="5", state=fsm_context
        )
        self._assert_msg_err(result)
        self.mock_update_user.assert_not_called()
