import re

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
from repository.user import count_users_with_name, get_user_expect, update_user
from schema.user import UserUpdate
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

        await update_user(
            session, message.from_user.id, UserUpdate(reg_stat=UserState.RENAME)
        )
        await state.set_state(RenameStates.waiting_for_new_name)


@router.message(RenameStates.waiting_for_new_name)
async def rename_set_name(message: Message, state: FSMContext) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    user_id = message.from_user.id
    new_name = message.text.strip()

    async for session in get_session():
        if new_name == (await get_user_expect(session, message.from_user.id)).name:
            await message.answer(Messages.same_name(new_name))
        elif len(new_name) < 3:
            await message.answer(Messages.message_too_short())
        elif len(new_name) > 40:
            await message.answer(Messages.message_too_long())
        elif not re.fullmatch(r"^[а-яА-ЯёЁa-zA-Z0-9\s\-'.]+$", new_name):
            await message.answer(Messages.invalid_characters())

        other_users = await count_users_with_name(session, new_name)
        if other_users > 0:
            await message.answer(Messages.name_already_exists())

        user = await get_user_expect(session, user_id)
        old_name = user.name

        actions = ActionService(session)
        await actions.log_bot_rename(
            user_id=user_id,
            old=old_name,
            new=new_name,
        )

        await update_user(
            session,
            user_id,
            UserUpdate(name=new_name, reg_stat=UserState.REG_COMPLETED),
        )
        await state.clear()
        await message.answer(Messages.rename_success(new_name))
