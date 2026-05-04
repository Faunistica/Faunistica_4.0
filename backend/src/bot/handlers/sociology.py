from aiogram import Bot, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.messages import Messages
from bot.states import SociologyStates
from core.config import settings
from core.dependencies import get_session
from core.exceptions import MsgErr
from service.actions import ActionService
from service.user import FlowType, UserService

router = Router()


class HandlerError(Exception):
    MSG_INCORRECTLY_CONFIGURED = "incorrectly configured handler"


@router.message(Command("sociology"))
async def sociology_command(message: Message, state: FSMContext, bot: Bot) -> None:
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


@router.message(SociologyStates.waiting_for_age)
async def sociology_age_handler(message: Message, state: FSMContext, bot: Bot) -> None:
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

        if result.completed:
            await message.answer(Messages.sociology_completed())
        elif result.message:
            await message.answer(result.message)


@router.message(SociologyStates.waiting_for_language)
async def sociology_lang_handler(message: Message, state: FSMContext, bot: Bot) -> None:
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

        if result.completed:
            await message.answer(Messages.sociology_completed())
        elif result.message:
            await message.answer(result.message)


@router.message(SociologyStates.waiting_for_comments)
async def sociology_comments_handler(
    message: Message, state: FSMContext, bot: Bot
) -> None:
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

        if result.completed:
            await message.answer(Messages.sociology_completed())
        elif result.message:
            await message.answer(result.message)


@router.message(SociologyStates.waiting_for_gender)
async def sociology_gender_handler(
    message: Message, state: FSMContext, bot: Bot
) -> None:
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

        if result.completed:
            await message.answer(Messages.sociology_completed())
        elif result.message:
            await message.answer(result.message)


@router.message(SociologyStates.waiting_for_rating_agreement)
async def sociology_rating_handler(
    message: Message, state: FSMContext, bot: Bot
) -> None:
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

        if result.completed:
            await message.answer(Messages.sociology_completed())
        elif result.message:
            await message.answer(result.message)


@router.message(SociologyStates.waiting_for_region)
async def sociology_region_handler(
    message: Message, state: FSMContext, bot: Bot
) -> None:
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

        if result.completed:
            await message.answer(Messages.sociology_completed())
        elif result.message:
            await message.answer(result.message)


@router.message(SociologyStates.waiting_for_email)
async def sociology_email_handler(
    message: Message, state: FSMContext, bot: Bot
) -> None:
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

        if result.completed:
            await message.answer(Messages.sociology_completed())
        elif result.message:
            await message.answer(result.message)
