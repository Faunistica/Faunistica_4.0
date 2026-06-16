from aiogram import Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.handlers.confirm import handle_code_input
from bot.i18n import BotLanguage, Messages
from core.config import settings
from core.exceptions import HandlerError

router = Router()


@router.message(Command("register"))
async def registration_info(message: Message, state: FSMContext, lang: BotLanguage) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    args = message.text.split()
    if len(args) > 1:
        await handle_code_input(message, state, lang)
        return

    await message.answer(
        Messages.registration_via_site(lang),
        disable_web_page_preview=True,
    )
