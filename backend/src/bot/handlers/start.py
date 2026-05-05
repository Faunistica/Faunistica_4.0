from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

from bot import keyboards
from bot.messages import Messages
from core.config import settings
from core.exceptions import HandlerError

router = Router()


@router.message(Command("start"))
async def start_command(message: Message) -> None:
    if message.from_user is None:
        raise HandlerError

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    await message.answer(
        Messages.start(message.from_user.first_name),
        parse_mode="HTML",
        disable_web_page_preview=True,
        reply_markup=keyboards.remove(),
    )
