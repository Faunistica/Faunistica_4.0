from aiogram import Bot, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.button_markups import Keyboards
from bot.messages import Messages
from bot.states import SupportStates
from core.config import settings
from core.dependencies import get_session
from core.enums import UserState
from core.exceptions import MsgErr
from repository.user import update_user
from schema.user import UserUpdate
from service.actions import ActionService
from service.user import FlowType, UserService

router = Router()


class HandlerError(Exception):
    MSG_INCORRECTLY_CONFIGURED = "incorrectly configured handler"


@router.message(Command("support"))
async def support_command(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

    if message.chat.id == settings.ADMIN_CHAT_ID:
        await message.answer(Messages.support_for_admins())
        return

    async for session in get_session():
        action_service = ActionService(session)
        user_service = UserService(session, bot, action_service)

        result = await user_service.start_flow(
            message.from_user.id, FlowType.SUPPORT, state
        )

        if isinstance(result, MsgErr):
            await message.answer(result.error)
            return

        if result.message:
            await message.answer(result.message, reply_markup=Keyboards.remove())
        if result.next_state:
            await state.set_state(result.next_state.fsm_state())


@router.message(SupportStates.waiting_for_question)
async def support_question_handler(
    message: Message, state: FSMContext, bot: Bot
) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

    if message.text.lower().strip() in ["cancel", "отмена"]:
        await message.answer(Messages.cancellation_support_request())
        async for session in get_session():
            await update_user(
                session,
                message.from_user.id,
                UserUpdate(reg_stat=UserState.REG_COMPLETED),
            )

        await state.clear()
        return

    async for session in get_session():
        action_service = ActionService(session)
        user_service = UserService(session, bot, action_service)

        result = await user_service.handle_flow_input(
            message.from_user.id, message.text, state
        )

        if isinstance(result, MsgErr):
            await message.answer(result.error)
            return

        if result.completed:
            await message.answer(
                Messages.support_request_received(),
                reply_markup=Keyboards.remove(),
                parse_mode="HTML",
            )
