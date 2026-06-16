from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

from bot import keyboards
from bot.i18n import BotLanguage, Messages, resolve_lang
from core.config import settings
from core.dependencies import get_session
from core.exceptions import HandlerError
from repository.stats import get_bot_general_stats, get_bot_user_stats
from repository.user import get_user

router = Router()


@router.message(Command("stats"))
async def stats_command(message: Message, lang: BotLanguage) -> None:
    if message.from_user is None:
        raise HandlerError

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    async for session in get_session():
        general_stats = await get_bot_general_stats(session)
        user_stats = None

        user = await get_user(session, message.from_user.id)
        if user is not None:
            user_lng = getattr(user, "lng", None)
            lang = resolve_lang(message.from_user.language_code, user_lng)

            has_current_publ = bool(user.items)
            stats = await get_bot_user_stats(session, message.from_user.id)
            if has_current_publ and stats["processed_publs"] > 0:
                stats["processed_publs"] -= 1
            user_stats = stats

        await message.answer(
            Messages.statistics(general_stats, user_stats, lang),
            parse_mode="HTML",
            reply_markup=keyboards.remove(),
        )
