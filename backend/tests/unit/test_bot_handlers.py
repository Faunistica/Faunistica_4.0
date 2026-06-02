from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, User

from bot.handlers.admin import logs, reply
from bot.handlers.menu import cancel, menu
from bot.handlers.registration import registration_start
from bot.handlers.start import start_command


async def _async_session_gen(session):
    yield session


@pytest.fixture
def mock_message():
    msg = MagicMock(spec=Message)
    msg.from_user = MagicMock(spec=User)
    msg.from_user.id = 12345
    msg.from_user.first_name = "Test"
    msg.chat = MagicMock()
    msg.chat.id = 12345
    msg.text = "/start"
    msg.answer = AsyncMock()
    return msg


@pytest.fixture
def mock_state():
    state = MagicMock(spec=FSMContext)
    state.set_state = AsyncMock()
    state.clear = AsyncMock()
    return state


@pytest.fixture
def mock_bot():
    bot = MagicMock()
    bot.send_message = AsyncMock()
    return bot


class TestStartCommand:
    async def test_start_command_success(self, mock_message):
        await start_command(mock_message)
        mock_message.answer.assert_called_once()

    async def test_start_command_admin_chat(self, mock_message):
        from core.config import settings

        mock_message.chat.id = settings.ADMIN_CHAT_ID
        await start_command(mock_message)
        mock_message.answer.assert_not_called()


class TestRegisterCommand:
    async def test_register_new_user(self, mock_message, mock_state, mock_bot):
        with (
            patch("bot.handlers.registration.UserService") as mock_user_service_cls,
            patch("bot.handlers.registration.get_session") as mock_get_session,
        ):
            mock_session = AsyncMock()
            mock_get_session.return_value = _async_session_gen(mock_session)
            mock_user_service = AsyncMock()
            mock_user_service_cls.return_value = mock_user_service
            mock_user_service.get.return_value = None

            await registration_start(mock_message, mock_state, mock_bot)
            mock_user_service.start_registration.assert_called_once_with(12345)
            mock_state.set_state.assert_called_once()

    async def test_register_existing_completed(
        self, mock_message, mock_state, mock_bot
    ):
        user = MagicMock()
        user.reg_stat = MagicMock()
        user.reg_stat.value = "completed"
        user.name = "TestUser"
        with (
            patch("bot.handlers.registration.UserService") as mock_user_service_cls,
            patch("bot.handlers.registration.get_session") as mock_get_session,
        ):
            mock_session = AsyncMock()
            mock_get_session.return_value = _async_session_gen(mock_session)
            mock_user_service = AsyncMock()
            mock_user_service_cls.return_value = mock_user_service
            mock_user_service.get.return_value = user

            await registration_start(mock_message, mock_state, mock_bot)
            mock_message.answer.assert_called()


class TestMenuCommand:
    async def test_menu_command_success(self, mock_message):
        await menu(mock_message)
        mock_message.answer.assert_called_once()

    async def test_menu_command_admin_chat(self, mock_message):
        from core.config import settings

        mock_message.chat.id = settings.ADMIN_CHAT_ID
        await menu(mock_message)
        mock_message.answer.assert_not_called()


class TestCancelCommand:
    async def test_cancel_command_success(self, mock_message, mock_state, mock_bot):
        with (
            patch("bot.handlers.menu.UserService") as mock_user_service_cls,
            patch("bot.handlers.menu.get_session") as mock_get_session,
        ):
            mock_session = AsyncMock()
            mock_get_session.return_value = _async_session_gen(mock_session)
            mock_user_service = AsyncMock()
            mock_user_service_cls.return_value = mock_user_service

            mock_user = MagicMock()
            mock_user.reg_stat = MagicMock()
            mock_user.reg_stat.is_in_registration.return_value = False
            mock_user.reg_stat.value = "completed"
            mock_user_service.get.return_value = mock_user
            mock_user_service.cancel_action.return_value = None

            await cancel(mock_message, mock_state, mock_bot)
            assert mock_message.answer.called


class TestReplyCommand:
    async def test_reply_not_admin(self, mock_message, mock_bot):
        mock_message.chat.id = 12345
        mock_message.text = "/reply Hello"
        await reply(mock_message, mock_bot)
        mock_message.answer.assert_called_once()

    async def test_reply_admin_no_reply(self, mock_message, mock_bot):
        from core.config import settings

        mock_message.chat.id = settings.ADMIN_CHAT_ID
        mock_message.reply_to_message = None
        mock_message.text = "/reply Hello"
        await reply(mock_message, mock_bot)
        mock_message.answer.assert_called_once()


class TestLogsCommand:
    async def test_logs_not_admin(self, mock_message):
        mock_message.chat.id = 12345
        mock_message.text = "/logs 2024-01-01"
        await logs(mock_message)
        mock_message.answer.assert_called_once()

    async def test_logs_no_date(self, mock_message):
        from core.config import settings

        mock_message.chat.id = settings.ADMIN_CHAT_ID
        mock_message.text = "/logs"
        await logs(mock_message)
        mock_message.answer.assert_called_once()
