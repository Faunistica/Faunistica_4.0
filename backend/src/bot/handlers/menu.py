from aiogram import Router
from aiogram.filters import Command, or_f
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot import keyboards
from bot.messages import Messages
from core.config import settings
from core.dependencies import get_session
from core.enums import UserState
from core.exceptions import HandlerError
from repository.user import get_user, update_user
from schema.user import UserUpdate

router = Router()


@router.message(
    or_f(Command("menu"), lambda msg: msg.text and "меню" in msg.text.lower())
)
async def menu(message: Message) -> None:
    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    await message.answer(Messages.called_menu(), parse_mode="HTML")


@router.message(Command("cancel"))
async def cancel(
    message: Message,
    state: FSMContext,
) -> None:
    if message.from_user is None:
        raise HandlerError

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    async for session in get_session():
        user = await get_user(session, message.from_user.id)

        if not user:
            await message.answer(Messages.not_registered())
            return
        if user.reg_stat == UserState.DATA_CLEARED:
            await message.answer(Messages.register_for_old())
            return
        if user.reg_stat.is_in_registration():
            await message.answer(
                Messages.unavailable_during_registration(),
                parse_mode="Markdown",
                disable_web_page_preview=True,
            )
            return

        await state.clear()

        await update_user(
            session, message.from_user.id, UserUpdate(reg_stat=UserState.REG_COMPLETED)
        )

    await message.answer(Messages.rollback_completed(), reply_markup=keyboards.remove())
