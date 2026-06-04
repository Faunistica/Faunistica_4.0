from datetime import datetime

from aiogram import Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.messages import Messages
from bot.states import ConfirmStates
from core.config import settings
from core.dependencies import get_session
from core.enums import PendingStatus
from core.exceptions import HandlerError
from repository.registration import get_pending_by_code, update_pending_by_code
from repository.user import find_user_by_username, get_user
from service.registration import is_enter_expired

router = Router()


@router.message(Command("confirm"))
async def confirm_registration(message: Message, state: FSMContext) -> None:
    if message.from_user is None:
        raise HandlerError

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return
    await message.answer(Messages.request_confirmation_code())
    await state.set_state(ConfirmStates.waiting_for_code)


@router.message(ConfirmStates.waiting_for_code)
async def handle_code_input(message: Message, state: FSMContext) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError
    code = message.text.strip()
    async for session in get_session():
        pending = await get_pending_by_code(session, code)
        if pending is None:
            await message.answer(Messages.confirmation_code_invalid())
            return

        if pending.status == PendingStatus.CODE_PROCESSING and is_enter_expired(
            pending.code_created_at, settings.TG_CODE_EXPIRE_SECONDS
        ):
            await message.answer(Messages.confirmation_code_expired())
            return

        if pending.status != PendingStatus.CODE_PROCESSING:
            await message.answer(Messages.confirmation_code_used())
            return

        existing_user = await get_user(session, message.from_user.id)
        if existing_user:
            await update_pending_by_code(session, code, status=PendingStatus.AUTH)
            await session.commit()
            await message.answer(Messages.already_registered(existing_user.name))
            return
        if pending.username:
            user_with_name = await find_user_by_username(session, pending.username)
            if user_with_name is not None and (
                existing_user is None or user_with_name.user_id != existing_user.user_id
            ):
                await message.answer(Messages.username_conflict())
                return

        now = datetime.now()
        tlg_name = message.from_user.full_name
        tlg_username = message.from_user.username
        await update_pending_by_code(
            session,
            code,
            status=PendingStatus.REGISTRATION,
            confirmed_at=now,
            telegram_id=message.from_user.id,
            telegram_username=tlg_username,
            telegram_name=tlg_name,
        )
        await session.commit()

    await message.answer(Messages.registration_confirmed(), parse_mode="HTML")
    await state.clear()
