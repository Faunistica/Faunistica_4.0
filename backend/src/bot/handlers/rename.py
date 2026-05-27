from aiogram import Bot, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.messages import Messages
from bot.states import RenameStates
from core.config import settings
from core.dependencies import get_session
from core.enums import UserState
from core.exceptions import HandlerError, MsgErr
from service.actions import ActionService
from service.user import UserService

router = Router()


@router.message(Command("rename"))
async def rename_start(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None:
        raise HandlerError

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    async for session in get_session():
        action_service = ActionService(session)
        user_service = UserService(session, bot, action_service)

        res = await user_service.check_commands_allowed(user_id=message.from_user.id)
        if isinstance(res, MsgErr):
            await message.answer(res.error)
            return

        await user_service.set_state(message.from_user.id, UserState.RENAME)
        await state.set_state(RenameStates.waiting_for_new_name)


@router.message(RenameStates.waiting_for_new_name)
async def rename_set_name(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    new_name = message.text.strip()

    async for session in get_session():
        user_service = UserService(session, bot, ActionService(session))
        result = await user_service.rename_user(message.from_user.id, new_name)

        if isinstance(result, MsgErr):
            await message.answer(result.error)
            return

        await state.clear()
        await message.answer(Messages.rename_success(new_name))
