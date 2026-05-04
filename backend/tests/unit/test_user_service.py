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
        with patch(
            "service.user.get_user_expect", new_callable=AsyncMock
        ) as self.mock_get_user:
            yield

    @pytest.mark.asyncio
    async def test_registered_user(self, user_service: UserService) -> None:
        self.mock_get_user.return_value = User(
            user_id=12345, reg_stat=UserState.REG_COMPLETED
        )
        result = await user_service.check_command_allowed(12345)
        assert isinstance(result, Ok)

    @pytest.mark.asyncio
    async def test_unregistered_user(self, user_service: UserService) -> None:
        self.mock_get_user.return_value = User(
            user_id=54321, reg_stat=UserState.DATA_CLEARED
        )
        result = await user_service.check_command_allowed(54321)
        assert isinstance(result, MsgErr)

    @pytest.mark.asyncio
    async def test_user_in_registration(self, user_service: UserService) -> None:
        self.mock_get_user.return_value = User(
            user_id=99999, reg_stat=UserState.REG_AGREEMENT
        )
        result = await user_service.check_command_allowed(99999)
        assert isinstance(result, MsgErr)

    @pytest.mark.asyncio
    async def test_user_in_survey(self, user_service: UserService) -> None:
        self.mock_get_user.return_value = User(
            user_id=88888, reg_stat=UserState.SURVEY_AGE
        )
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
            patch(
                "service.user.get_user_expect", new_callable=AsyncMock
            ) as self.mock_get_user,
            patch(
                "service.user.update_user", new_callable=AsyncMock
            ) as self.mock_update_user,
            patch(
                "service.user.count_users_with_name", new_callable=AsyncMock
            ) as self.mock_count_users,
            patch(
                "service.user.get_publications_for_language", new_callable=AsyncMock
            ) as self.mock_get_pubs,
        ):
            yield

    def _assert_flow_ok(
        self, result: FlowResult, next_state: UserState | None = None
    ) -> FlowOk:
        assert isinstance(result, FlowOk)
        if next_state is not None:
            assert result.next_state == next_state
        return result

    def _assert_msg_err(
        self, result: FlowResult, error_substring: str | None = None
    ) -> MsgErr:
        assert isinstance(result, MsgErr)
        if error_substring is not None:
            assert error_substring in result.error
        return result

    @pytest.mark.asyncio
    async def test_start_registration(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        result = await user_service.start_flow(
            user_id=11111, flow_type=FlowType.REGISTRATION, state=fsm_context
        )
        self._assert_flow_ok(result, UserState.REG_AGREEMENT)

    @pytest.mark.asyncio
    async def test_handle_agreement_accept(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
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
    async def test_handle_name_too_short(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        await fsm_context.set_state(UserState.REG_NAME.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=33334, input_text="Jo", state=fsm_context
        )
        self._assert_msg_err(result, "short")
        self.mock_update_user.assert_not_called()

    @pytest.mark.asyncio
    async def test_handle_name_invalid_chars(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
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


class TestSurveyFlow:
    @pytest.fixture(autouse=True, scope="function")
    def setup_mocks(self):
        with (
            patch(
                "service.user.get_user_expect", new_callable=AsyncMock
            ) as self.mock_get_user,
            patch(
                "service.user.update_user", new_callable=AsyncMock
            ) as self.mock_update_user,
        ):
            yield

    def _assert_flow_ok(
        self, result: FlowResult, next_state: UserState | None = None
    ) -> FlowOk:
        assert isinstance(result, FlowOk)
        if next_state is not None:
            assert result.next_state == next_state
        return result

    def _assert_msg_err(
        self, result: FlowResult, error_substring: str | None = None
    ) -> MsgErr:
        assert isinstance(result, MsgErr)
        if error_substring is not None:
            assert error_substring in result.error
        return result

    @pytest.mark.asyncio
    async def test_start_survey_all_fields_missing(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test survey starts with all missing fields."""
        self.mock_get_user.return_value = User(
            user_id=77777,
            reg_stat=UserState.REG_COMPLETED,
            age=None,
            lng=None,
            comm=None,
            sex=None,
            rating=None,
            email=None,
            region=None,
        )
        result = await user_service.start_flow(
            user_id=77777, flow_type=FlowType.SURVEY, state=fsm_context
        )
        self._assert_flow_ok(result, UserState.SURVEY_AGE)

    @pytest.mark.asyncio
    async def test_start_survey_some_fields_missing(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test survey starts with only some fields missing."""
        self.mock_get_user.return_value = User(
            user_id=77778,
            reg_stat=UserState.REG_COMPLETED,
            age=25,
            lng="eng",
            comm="Biology",
            sex=None,
            rating=1,
            email=None,
            region=None,
        )
        result = await user_service.start_flow(
            user_id=77778, flow_type=FlowType.SURVEY, state=fsm_context
        )
        # Missing fields in order: region (18), email (19), sex (20)
        self._assert_flow_ok(result, UserState.SURVEY_REGION)

    @pytest.mark.asyncio
    async def test_start_survey_no_fields_missing(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test survey returns error when all fields present."""
        self.mock_get_user.return_value = User(
            user_id=77779,
            reg_stat=UserState.REG_COMPLETED,
            age=25,
            lng="eng",
            comm="Biology",
            sex="mm",
            rating=1,
            email="test@example.com",
            region="Moscow",
        )
        result = await user_service.start_flow(
            user_id=77779, flow_type=FlowType.SURVEY, state=fsm_context
        )
        self._assert_msg_err(result, "completed")

    @pytest.mark.asyncio
    async def test_survey_progresses_through_states(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test survey progresses through states 14→15→16→17→18→19→20→1."""
        self.mock_get_user.return_value = User(
            user_id=88888,
            reg_stat=UserState.REG_COMPLETED,
            age=None,
            lng=None,
            comm=None,
            sex=None,
            rating=None,
            email=None,
            region=None,
        )

        # Start survey - should start with age (state 14)
        result = await user_service.start_flow(
            user_id=88888, flow_type=FlowType.SURVEY, state=fsm_context
        )
        self._assert_flow_ok(result, UserState.SURVEY_AGE)

        # Answer age (14)
        result = await user_service.handle_flow_input(
            user_id=88888, input_text="25", state=fsm_context
        )
        self._assert_flow_ok(result, UserState.SURVEY_PREFERENCES)

        # Answer preferences (15)
        result = await user_service.handle_flow_input(
            user_id=88888, input_text="Biology", state=fsm_context
        )
        self._assert_flow_ok(result, UserState.SURVEY_LANGUAGE)

        # Answer language (16)
        result = await user_service.handle_flow_input(
            user_id=88888, input_text="1", state=fsm_context
        )
        self._assert_flow_ok(result, UserState.SURVEY_RATING)

        # Answer rating (17)
        result = await user_service.handle_flow_input(
            user_id=88888, input_text="yes", state=fsm_context
        )
        self._assert_flow_ok(result, UserState.SURVEY_REGION)

        # Answer region (18)
        result = await user_service.handle_flow_input(
            user_id=88888, input_text="Moscow", state=fsm_context
        )
        self._assert_flow_ok(result, UserState.SURVEY_EMAIL)

        # Answer email (19)
        result = await user_service.handle_flow_input(
            user_id=88888, input_text="test@example.com", state=fsm_context
        )
        self._assert_flow_ok(result, UserState.SURVEY_SEX)

        # Answer sex (20) - should complete
        result = await user_service.handle_flow_input(
            user_id=88888, input_text="male", state=fsm_context
        )
        flow_ok = self._assert_flow_ok(result, UserState.REG_COMPLETED)
        assert flow_ok.completed is True

    @pytest.mark.asyncio
    async def test_survey_completes_and_sets_reg_stat_1(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test survey completes and sets reg_stat=1."""
        self.mock_get_user.return_value = User(
            user_id=88889,
            reg_stat=UserState.REG_COMPLETED,
            age=25,
            lng="eng",
            comm="Biology",
            sex=None,
            rating=1,
            email="test@example.com",
            region="Moscow",
        )

        # Start survey - should start with sex (only missing field)
        result = await user_service.start_flow(
            user_id=88889, flow_type=FlowType.SURVEY, state=fsm_context
        )
        self._assert_flow_ok(result, UserState.SURVEY_SEX)

        # Answer sex - only field missing, should complete
        result = await user_service.handle_flow_input(
            user_id=88889, input_text="female", state=fsm_context
        )
        flow_ok = self._assert_flow_ok(result, UserState.REG_COMPLETED)
        assert flow_ok.completed is True

        # Verify update_user was called with reg_stat=REG_COMPLETED
        update_calls = self.mock_update_user.call_args_list
        final_call = update_calls[-1]
        update_data = final_call[0][2]
        assert update_data.reg_stat == UserState.REG_COMPLETED

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
            self.mock_update_user.reset_mock()
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
            result = await user_service.check_command_allowed(99999)
            assert isinstance(result, MsgErr)

    @pytest.mark.asyncio
    async def test_handle_survey_age_valid(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test survey age handler with valid input."""
        self.mock_get_user.return_value = User(
            user_id=88890,
            reg_stat=UserState.SURVEY_AGE,
            age=None,
            lng=None,
            comm=None,
            sex=None,
            rating=1,
            email=None,
            region=None,
        )
        await fsm_context.set_state(UserState.SURVEY_AGE.fsm_state())
        await fsm_context.update_data(
            missing_fields=["age", "lng", "comm", "sex", "email", "region"]
        )

        result = await user_service.handle_flow_input(
            user_id=88890, input_text="25", state=fsm_context
        )
        self._assert_flow_ok(result, UserState.SURVEY_LANGUAGE)
        self.mock_update_user.assert_called()

    @pytest.mark.asyncio
    async def test_handle_survey_age_invalid(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test survey age handler with invalid input."""
        await fsm_context.set_state(UserState.SURVEY_AGE.fsm_state())

        result = await user_service.handle_flow_input(
            user_id=88891, input_text="abc", state=fsm_context
        )
        self._assert_msg_err(result, "number")
        self.mock_update_user.assert_not_called()

    @pytest.mark.asyncio
    async def test_handle_survey_email_valid(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test survey email handler with valid input."""
        await fsm_context.set_state(UserState.SURVEY_EMAIL.fsm_state())
        await fsm_context.update_data(missing_fields=["email", "region"])

        result = await user_service.handle_flow_input(
            user_id=88892, input_text="test@example.com", state=fsm_context
        )
        self._assert_flow_ok(result, UserState.SURVEY_REGION)
        self.mock_update_user.assert_called()

    @pytest.mark.asyncio
    async def test_handle_survey_email_invalid(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test survey email handler with invalid input."""
        await fsm_context.set_state(UserState.SURVEY_EMAIL.fsm_state())

        result = await user_service.handle_flow_input(
            user_id=88893, input_text="invalid-email", state=fsm_context
        )
        self._assert_msg_err(result, "Invalid email")
        self.mock_update_user.assert_not_called()

    @pytest.mark.asyncio
    async def test_survey_missing_fields_includes_email_and_region(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test that email and region are included in missing fields check."""
        self.mock_get_user.return_value = User(
            user_id=88894,
            reg_stat=UserState.REG_COMPLETED,
            age=25,
            lng="eng",
            comm="Biology",
            sex="mm",
            rating=1,
            email=None,  # Missing email
            region=None,  # Missing region
        )

        result = await user_service.start_flow(
            user_id=88894, flow_type=FlowType.SURVEY, state=fsm_context
        )
        self._assert_flow_ok(result)

        # Check FSM context has missing fields including email and region
        data = await fsm_context.get_data()
        assert "email" in data["missing_fields"]
        assert "region" in data["missing_fields"]


class TestSupportFlow:
    @pytest.fixture(autouse=True, scope="function")
    def setup_mocks(self):
        with (
            patch(
                "service.user.get_user_expect", new_callable=AsyncMock
            ) as self.mock_get_user,
            patch(
                "service.user.update_user", new_callable=AsyncMock
            ) as self.mock_update_user,
            patch("service.user.settings") as self.mock_settings,
        ):
            self.mock_settings.ADMIN_CHAT_ID = 123456
            yield

    def _assert_flow_ok(
        self, result: FlowResult, next_state: UserState | None = None
    ) -> FlowOk:
        assert isinstance(result, FlowOk)
        if next_state is not None:
            assert result.next_state == next_state
        return result

    def _assert_msg_err(
        self, result: FlowResult, error_substring: str | None = None
    ) -> MsgErr:
        assert isinstance(result, MsgErr)
        if error_substring is not None:
            assert error_substring in result.error
        return result

    @pytest.mark.asyncio
    async def test_start_support(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test starting support flow."""
        self.mock_get_user.return_value = User(
            user_id=77777,
            reg_stat=UserState.REG_COMPLETED,
            name="Test User",
        )
        result = await user_service.start_flow(
            user_id=77777, flow_type=FlowType.SUPPORT, state=fsm_context
        )
        flow_ok = self._assert_flow_ok(result, UserState.SUPPORT)
        assert flow_ok.message is not None
        assert (
            "issue" in flow_ok.message.lower() or "describe" in flow_ok.message.lower()
        )

    @pytest.mark.asyncio
    async def test_support_during_registration_blocked(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test support is blocked during registration (reg_stat 2-6)."""
        for reg_stat in [
            UserState.REG_AGREEMENT,
            UserState.REG_NAME,
            UserState.REG_AGE,
            UserState.REG_PREFERENCES,
            UserState.REG_LANGUAGE,
        ]:
            self.mock_get_user.return_value = User(
                user_id=77778,
                reg_stat=reg_stat,
                name="Test User",
            )
            result = await user_service.start_flow(
                user_id=77778, flow_type=FlowType.SUPPORT, state=fsm_context
            )
            self._assert_msg_err(result, "registration")

    @pytest.mark.asyncio
    async def test_handle_support_input_valid(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test handling valid support question."""
        self.mock_get_user.return_value = User(
            user_id=77779,
            reg_stat=UserState.SUPPORT,
            name="Test User",
        )
        await fsm_context.set_state(UserState.SUPPORT.fsm_state())

        with patch.object(
            user_service.bot, "send_message", new_callable=AsyncMock
        ) as mock_send:
            result = await user_service.handle_flow_input(
                user_id=77779,
                input_text="This is my support question that is long enough",
                state=fsm_context,
            )
            flow_ok = self._assert_flow_ok(result, UserState.REG_COMPLETED)
            assert flow_ok.completed is True
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_support_input_too_short(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test handling support question that is too short."""
        await fsm_context.set_state(UserState.SUPPORT.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=77780,
            input_text="Short",
            state=fsm_context,
        )
        self._assert_msg_err(result, "short")

    @pytest.mark.asyncio
    async def test_support_forwards_to_admin(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test support question is forwarded to admin chat."""
        self.mock_get_user.return_value = User(
            user_id=77781,
            reg_stat=UserState.SUPPORT,
            name="Test User",
        )
        await fsm_context.set_state(UserState.SUPPORT.fsm_state())

        with patch.object(
            user_service.bot, "send_message", new_callable=AsyncMock
        ) as mock_send:
            result = await user_service.handle_flow_input(
                user_id=77781,
                input_text="This is a valid support question with enough characters",
                state=fsm_context,
            )
            self._assert_flow_ok(result)
            mock_send.assert_called_once()
            call_args = mock_send.call_args
            assert call_args[1]["chat_id"] == 123456
            assert "Test User" in call_args[1]["text"]


class TestRenameFlow:
    @pytest.fixture(autouse=True, scope="function")
    def setup_mocks(self):
        with (
            patch(
                "service.user.get_user_expect", new_callable=AsyncMock
            ) as self.mock_get_user,
            patch(
                "service.user.update_user", new_callable=AsyncMock
            ) as self.mock_update_user,
            patch(
                "service.user.count_users_with_name", new_callable=AsyncMock
            ) as self.mock_count_users,
        ):
            yield

    def _assert_flow_ok(
        self, result: FlowResult, next_state: UserState | None = None
    ) -> FlowOk:
        assert isinstance(result, FlowOk)
        if next_state is not None:
            assert result.next_state == next_state
        return result

    def _assert_msg_err(
        self, result: FlowResult, error_substring: str | None = None
    ) -> MsgErr:
        assert isinstance(result, MsgErr)
        if error_substring is not None:
            assert error_substring in result.error
        return result

    @pytest.mark.asyncio
    async def test_start_rename(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test starting rename flow."""
        self.mock_get_user.return_value = User(
            user_id=88885,
            reg_stat=UserState.REG_COMPLETED,
            name="Old Name",
        )
        result = await user_service.start_flow(
            user_id=88885, flow_type=FlowType.RENAME, state=fsm_context
        )
        flow_ok = self._assert_flow_ok(result, UserState.RENAME)
        assert flow_ok.message is not None
        assert "new name" in flow_ok.message.lower()

    @pytest.mark.asyncio
    async def test_rename_requires_registered(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test rename requires user to be registered."""
        for reg_stat in [
            UserState.DATA_CLEARED,
            UserState.REG_AGREEMENT,
            UserState.REG_NAME,
            UserState.SUPPORT,
            UserState.SURVEY_AGE,
        ]:
            self.mock_get_user.return_value = User(
                user_id=88886,
                reg_stat=reg_stat,
                name="Test User",
            )
            result = await user_service.start_flow(
                user_id=88886, flow_type=FlowType.RENAME, state=fsm_context
            )
            self._assert_msg_err(result, "registered")

    @pytest.mark.asyncio
    async def test_handle_rename_input_valid(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test handling valid rename input."""
        self.mock_count_users.return_value = 0
        self.mock_get_user.return_value = User(
            user_id=88887,
            reg_stat=UserState.RENAME,
            name="Old Name",
        )
        await fsm_context.set_state(UserState.RENAME.fsm_state())

        result = await user_service.handle_flow_input(
            user_id=88887,
            input_text="New Valid Name",
            state=fsm_context,
        )
        flow_ok = self._assert_flow_ok(result, UserState.REG_COMPLETED)
        assert flow_ok.completed is True
        self.mock_update_user.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_rename_input_too_short(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test handling rename input that is too short."""
        await fsm_context.set_state(UserState.RENAME.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=88888,
            input_text="Jo",
            state=fsm_context,
        )
        self._assert_msg_err(result, "short")

    @pytest.mark.asyncio
    async def test_handle_rename_input_duplicate_name(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test handling rename input with duplicate name."""
        self.mock_count_users.return_value = 1
        await fsm_context.set_state(UserState.RENAME.fsm_state())
        result = await user_service.handle_flow_input(
            user_id=88889,
            input_text="Existing Name",
            state=fsm_context,
        )
        self._assert_msg_err(result, "already taken")

    @pytest.mark.asyncio
    async def test_rename_logs_action(
        self, user_service: UserService, fsm_context: FSMContext
    ) -> None:
        """Test rename logs bot_rename action."""
        self.mock_count_users.return_value = 0
        self.mock_get_user.return_value = User(
            user_id=88890,
            reg_stat=UserState.RENAME,
            name="Old Name",
        )
        await fsm_context.set_state(UserState.RENAME.fsm_state())

        with patch.object(
            user_service.actions, "log_action", new_callable=AsyncMock
        ) as mock_log:
            result = await user_service.handle_flow_input(
                user_id=88890,
                input_text="New Name",
                state=fsm_context,
            )
            self._assert_flow_ok(result)
            mock_log.assert_called_once()
            call_args = mock_log.call_args
            assert call_args[1]["action_type"] == "bot_rename"
            assert call_args[1]["old_value"] == "Old Name"
            assert call_args[1]["new_value"] == "New Name"


class TestBackwardsCompatRegStat:
    """Test backwards compatibility with production reg_stat values 7 and 22."""

    @pytest.fixture(autouse=True, scope="function")
    def setup_mocks(self):
        with (
            patch(
                "service.user.get_user_expect", new_callable=AsyncMock
            ) as self.mock_get_user,
            patch("service.user.update_user", new_callable=AsyncMock),
        ):
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
            result = await user_service.check_command_allowed(99999)
            assert isinstance(result, MsgErr)
