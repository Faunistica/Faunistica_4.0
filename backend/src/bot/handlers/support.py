from aiogram import Bot, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot import keyboards
from bot.messages import Messages
from bot.states import SupportStates
from core.config import settings
from core.dependencies import get_session
from core.enums import UserState
from core.exceptions import HandlerError, MsgErr
from service.actions import ActionService
from service.user import UserService

router = Router()


@router.message(Command("support"))
async def support_command(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None:
        raise HandlerError

    if message.chat.id == settings.ADMIN_CHAT_ID:
        await message.answer(Messages.support_for_admins())
        return

    user_id = message.from_user.id

    async for session in get_session():
        action_service = ActionService(session)
        user_service = UserService(session, bot, action_service)

        result = await user_service.check_commands_allowed(user_id=user_id)
        if isinstance(result, MsgErr):
            await message.answer(result.error)
            return

        await user_service.set_state(user_id, UserState.SUPPORT)
        await state.set_state(UserState.SUPPORT.fsm_state())

        await message.answer(
            Messages.support_request(), reply_markup=keyboards.remove()
        )


@router.message(SupportStates.waiting_for_question)
async def support_question_handler(
    message: Message, state: FSMContext, bot: Bot
) -> None:
    if (
        message.from_user is None
        or message.from_user.username is None
        or message.text is None
    ):
        raise HandlerError

    question = message.text.strip()
    user_id = message.from_user.id

    if question.lower() in ["cancel", "отмена"]:
        async for session in get_session():
            user_service = UserService(session, bot)
            await user_service.reset_to_completed(user_id)

        await message.answer(Messages.cancellation_support_request())
        return

    if len(question) < 10:
        await message.answer(Messages.support_request_too_short())
        return
    if len(message.text) > 256:
        await message.answer(Messages.message_too_long())
        return

    async for session in get_session():
        user_service = UserService(session, bot)
        await user_service.reset_to_completed(user_id)
        await state.clear()

    await bot.send_message(
        chat_id=settings.ADMIN_CHAT_ID,
        text=Messages.request_for_support(
            message.from_user.username, message.from_user.id, question
        ),
    )

    await message.answer(
        Messages.support_request_received(),
        reply_markup=keyboards.remove(),
        parse_mode="HTML",
    )
