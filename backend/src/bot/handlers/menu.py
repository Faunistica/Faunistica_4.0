from aiogram import Bot, Router
from aiogram.filters import Command, or_f
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot import keyboards
from bot.i18n import BotLanguage, Messages, resolve_lang
from core.config import settings
from core.dependencies import get_session
from core.exceptions import HandlerError, MsgErr
from service.user import UserService

router = Router()


@router.message(
    or_f(Command("menu"), lambda msg: msg.text and "меню" in msg.text.lower())
)
async def menu(message: Message, lang: BotLanguage) -> None:
    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    await message.answer(Messages.called_menu(lang), parse_mode="HTML")


@router.message(Command("cancel"))
async def cancel(
    message: Message,
    state: FSMContext,
    bot: Bot,
    lang: BotLanguage,
) -> None:
    if message.from_user is None:
        raise HandlerError

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    async for session in get_session():
        user_service = UserService(session, bot)
        user = await user_service.get(message.from_user.id)

        if not user:
            await message.answer(Messages.not_registered(lang))
            return

        user_lang = getattr(user, "lng", None)
        lang = resolve_lang(message.from_user.language_code, user_lang)

        result = await user_service.cancel_action(user)
        if isinstance(result, MsgErr):
            await message.answer(
                result.error,
                parse_mode="Markdown",
                disable_web_page_preview=True,
            )
            return

        await state.clear()

    await message.answer(Messages.rollback_completed(lang), reply_markup=keyboards.remove())
