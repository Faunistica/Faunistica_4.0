from aiogram import Bot, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.button_markups import Keyboards
from bot.messages import Messages
from core.config import settings
from core.dependencies import get_session
from core.exceptions import MsgErr
from service.actions import ActionService
from service.user import FlowType, UserService

router = Router()


class HandlerError(Exception):
    MSG_INCORRECTLY_CONFIGURED = "incorrectly configured handler"


@router.message(Command("menu"))
async def menu_command(message: Message) -> None:
    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    await message.answer(Messages.called_menu(), parse_mode="HTML")


@router.message(Command("cancel"))
async def cancel_command(message: Message, state: FSMContext, bot: Bot) -> None:
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

        await state.clear()

    await message.answer(Messages.rollback_completed(), reply_markup=Keyboards.remove())


@router.message(lambda msg: msg.text and "меню" in msg.text.lower())
async def menu_text_handler(message: Message) -> None:
    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    await message.answer(Messages.called_menu(), parse_mode="HTML")


@router.message(lambda msg: msg.text and "опрос" in msg.text.lower())
async def sociology_text_handler(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    if message.chat.id < 0:
        return

    async for session in get_session():
        action_service = ActionService(session)
        user_service = UserService(session, bot, action_service)

        res = await user_service.check_command_allowed(message.from_user.id)
        if isinstance(res, MsgErr):
            await message.answer(res.error)
            return

        result = await user_service.start_flow(
            message.from_user.id, FlowType.SURVEY, state
        )

        if isinstance(result, MsgErr):
            await message.answer(result.error)
            return

        if result.message:
            await message.answer(result.message)


@router.message()
async def other_content_handler(message: Message) -> None:
    if message.from_user is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    async for session in get_session():
        action_service = ActionService(session)
        await action_service.log_bot_other(
            message.from_user.id, content_type=message.content_type, ip=None
        )
    await message.answer(Messages.unknown_content(), reply_markup=Keyboards.remove())
