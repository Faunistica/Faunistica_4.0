from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, User

from bot.handlers.admin import reply_to_user_command, send_logs_command
from bot.handlers.auth import register_command, start_command
from bot.handlers.menu import cancel_command, menu_command


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
    async def test_register_new_user(self, mock_message, mock_state):
        with (
            patch("bot.handlers.auth.get_user_expect", return_value=None),
            patch("bot.handlers.auth.create_user", new_callable=AsyncMock),
            patch("bot.handlers.auth.continue_registration", new_callable=AsyncMock),
        ):
            await register_command(mock_message, mock_state)
            mock_state.set_state.assert_called_once()

    async def test_register_existing_completed(self, mock_message, mock_state):
        user = MagicMock()
        user.reg_stat = MagicMock()
        user.reg_stat.value = "completed"
        user.name = "TestUser"
        with patch("bot.handlers.auth.get_user_expect", return_value=user):
            await register_command(mock_message, mock_state)
            mock_message.answer.assert_called()


class TestMenuCommand:
    async def test_menu_command_success(self, mock_message):
        await menu_command(mock_message)
        mock_message.answer.assert_called_once()

    async def test_menu_command_admin_chat(self, mock_message):
        from core.config import settings

        mock_message.chat.id = settings.ADMIN_CHAT_ID
        await menu_command(mock_message)
        mock_message.answer.assert_not_called()


class TestCancelCommand:
    async def test_cancel_command_success(self, mock_message, mock_state, mock_bot):
        with patch("bot.handlers.menu.get_session") as mock_get_session:
            mock_session = AsyncMock()
            mock_get_session.return_value.__aenter__ = AsyncMock(
                return_value=mock_session
            )
            mock_get_session.return_value.__aexit__ = AsyncMock(return_value=False)

            with patch("bot.handlers.menu.UserService") as MockUserService:
                mock_service = MagicMock()
                # Return an Ok object (which has success=True)
                from core.exceptions import Ok

                mock_service.check_command_allowed = AsyncMock(return_value=Ok())
                MockUserService.return_value = mock_service

                # Just verify the function runs without error
                await cancel_command(mock_message, mock_state, mock_bot)
                # Verify that answer was called at least once
                assert mock_message.answer.called


class TestReplyCommand:
    async def test_reply_not_admin(self, mock_message, mock_bot):
        mock_message.chat.id = 12345
        mock_message.text = "/reply Hello"
        await reply_to_user_command(mock_message, mock_bot)
        mock_message.answer.assert_called_once()

    async def test_reply_admin_no_reply(self, mock_message, mock_bot):
        from core.config import settings

        mock_message.chat.id = settings.ADMIN_CHAT_ID
        mock_message.reply_to_message = None
        mock_message.text = "/reply Hello"
        await reply_to_user_command(mock_message, mock_bot)
        mock_message.answer.assert_called_once()


class TestLogsCommand:
    async def test_logs_not_admin(self, mock_message):
        mock_message.chat.id = 12345
        mock_message.text = "/logs 2024-01-01"
        await send_logs_command(mock_message)
        mock_message.answer.assert_called_once()

    async def test_logs_no_date(self, mock_message):
        from core.config import settings

        mock_message.chat.id = settings.ADMIN_CHAT_ID
        mock_message.text = "/logs"
        await send_logs_command(mock_message)
        mock_message.answer.assert_called_once()
