import logging
from datetime import UTC, datetime

from aiogram import Router
from aiogram.filters import Command, or_f
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.i18n import BotLanguage, Messages
from bot.states import ConfirmStates
from core.config import settings
from core.dependencies import get_session
from core.enums import PendingStatus
from core.exceptions import HandlerError
from repository.registration import get_pending_by_code, update_pending_by_code
from repository.user import get_user
from service.registration import is_enter_expired

router = Router()
logger = logging.getLogger(__name__)


@router.message(Command("confirm"))
async def confirm_registration(message: Message, state: FSMContext, lang: BotLanguage) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    args = message.text.split()
    if len(args) > 1:
        await handle_code_input(message, state, lang)
        return

    await message.answer(Messages.request_confirmation_code(lang))
    await state.set_state(ConfirmStates.waiting_for_code)


@router.message(
    or_f(
        ConfirmStates.waiting_for_code,
        lambda msg: (
            msg.text and len(msg.text.strip()) == 6 and msg.text.strip().isdigit()
        ),
    ),
    ~Command("start", "menu", "register", "confirm", "support", "cancel"),
)
async def handle_code_input(message: Message, state: FSMContext, lang: BotLanguage) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    args = message.text.split()
    code = message.text.strip()
    if len(args) > 1:
        code = args[1].strip()

    async for session in get_session():
        pending = await get_pending_by_code(session, code)
        if pending and is_enter_expired(
            pending.code_created_at, settings.TG_CODE_EXPIRE_SECONDS
        ):
            pending = None
        if pending is None:
            await state.clear()
            await message.answer(Messages.confirmation_code_invalid(lang))
            return

        if pending.status == PendingStatus.AWAITING_CODE and is_enter_expired(
            pending.code_created_at, settings.TG_CODE_EXPIRE_SECONDS
        ):
            await state.clear()
            await message.answer(Messages.confirmation_code_expired(lang))
            return

        if pending.status != PendingStatus.AWAITING_CODE:
            await state.clear()
            await message.answer(Messages.confirmation_code_used(lang))
            return

        existing_user = await get_user(session, message.from_user.id)
        if existing_user:
            await update_pending_by_code(
                session,
                code,
                status=PendingStatus.AWAITING_API_LOGIN,
                telegram_id=message.from_user.id,
            )
            await session.commit()
            await message.answer(Messages.auth_confirmed(lang))
            await state.clear()
            return

        tlg_name = message.from_user.full_name
        tlg_username = message.from_user.username
        try:
            await update_pending_by_code(
                session,
                code,
                status=PendingStatus.AWAITING_API_REGISTRATION,
                reg_run=datetime.now(UTC).replace(tzinfo=None),
                telegram_id=message.from_user.id,
                telegram_username=tlg_username,
                telegram_name=tlg_name,
            )
            await session.commit()
        except Exception as e:
            await session.rollback()
            await message.answer(Messages.registration_failed(lang))
            logger.error(
                "Update pending by code for new user failed: %s", str(e), exc_info=True
            )

    await message.answer(Messages.registration_confirmed(lang), parse_mode="HTML")
    await state.clear()
