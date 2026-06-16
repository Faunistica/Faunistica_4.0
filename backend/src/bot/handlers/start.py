from aiogram import Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot import keyboards
from bot.handlers.confirm import handle_code_input
from bot.handlers.support import support_command
from bot.i18n import BotLanguage, Messages
from core.config import settings
from core.exceptions import HandlerError

router = Router()


@router.message(Command("start"))
async def start_command(message: Message, state: FSMContext, lang: BotLanguage) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    args = message.text.split()
    if len(args) > 1:
        if args[1] == "support":
            await support_command(message, state, message.bot, lang)
        else:
            await handle_code_input(message, state, lang)
        return

    await message.answer(
        Messages.start(message.from_user.first_name, lang),
        parse_mode="HTML",
        disable_web_page_preview=True,
        reply_markup=keyboards.remove(),
    )
