from aiogram import Router
from aiogram.types import Message

from bot import keyboards
from bot.messages import Messages
from core.config import settings
from core.dependencies import get_session
from core.exceptions import HandlerError
from service.actions import ActionService

router = Router()


@router.message()
async def fallback(message: Message) -> None:
    if message.from_user is None:
        raise HandlerError

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    async for session in get_session():
        action_service = ActionService(session)
        await action_service.log_bot_other(
            message.from_user.id, content_type=message.content_type, ip=None
        )
    await message.answer(Messages.unknown_content(), reply_markup=keyboards.remove())
