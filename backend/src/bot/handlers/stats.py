from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

from bot.button_markups import Keyboards
from bot.messages import Messages
from core.config import settings
from core.dependencies import get_session
from repository.stats import get_project_statistics, get_user_statistics
from repository.user import get_user_expect

router = Router()


class HandlerError(Exception):
    MSG_INCORRECTLY_CONFIGURED = "incorrectly configured handler"


@router.message(Command("stats"))
async def stats_command(message: Message) -> None:
    if message.from_user is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    async for session in get_session():
        project_stats = await get_project_statistics(session)
        user_stats = None

        user = await get_user_expect(session, message.from_user.id)
        if user is not None:
            user_stats = await get_user_statistics(session, message.from_user.id)

        await message.answer(
            Messages.statistics(project_stats, user_stats),
            parse_mode="HTML",
            reply_markup=Keyboards.remove(),
        )
