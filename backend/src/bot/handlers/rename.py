from aiogram import Bot, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.button_markups import Keyboards
from bot.messages import Messages
from bot.states import RenameStates
from core.config import settings
from core.dependencies import get_session
from core.exceptions import MsgErr
from repository.user import get_user_expect
from service.actions import ActionService
from service.user import FlowType, UserService

router = Router()


class HandlerError(Exception):
    MSG_INCORRECTLY_CONFIGURED = "incorrectly configured handler"


@router.message(Command("rename"))
async def rename_command(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    async for session in get_session():
        action_service = ActionService(session)
        user_service = UserService(session, bot, action_service)

        res = await user_service.check_command_allowed(message.from_user.id)
        if isinstance(res, MsgErr):
            await message.answer(res.error)
            return

        user = await get_user_expect(session, message.from_user.id)
        if user.reg_stat.is_in_survey():
            await message.answer(Messages.sociology_not_finished())
            return

        result = await user_service.start_flow(
            message.from_user.id, FlowType.RENAME, state
        )

        if isinstance(result, MsgErr):
            await message.answer(result.error)
            return

        if result.message:
            await message.answer(result.message, reply_markup=Keyboards.remove())
        if result.next_state:
            await state.set_state(result.next_state.fsm_state())


@router.message(RenameStates.waiting_for_new_name)
async def rename_name_handler(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

    async for session in get_session():
        action_service = ActionService(session)
        user_service = UserService(session, bot, action_service)

        result = await user_service.handle_flow_input(
            message.from_user.id, message.text, state
        )

        if isinstance(result, MsgErr):
            await message.answer(result.error)
            return

        if result.completed and result.message:
            await message.answer(result.message)
            await state.clear()
