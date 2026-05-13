import logging
from datetime import datetime

from aiogram import Bot, Router
from aiogram.filters import Command
from aiogram.types import Message

from bot.generate_pass import generate_secure_password
from bot.messages import Messages
from core.config import settings
from core.dependencies import get_session
from core.enums import UserState
from core.exceptions import HandlerError, MsgErr
from core.security import get_password_hash
from repository.user import (
    get_user_expect,
    update_user,
)
from schema.user import UserUpdate
from service.actions import ActionService
from service.publications import PublicationService
from service.user import UserService

router = Router()
logger = logging.getLogger(__name__)


@router.message(Command("auth"))
async def get_code(message: Message, bot: Bot) -> None:
    if message.from_user is None:
        raise HandlerError

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    async for session in get_session():
        action_service = ActionService(session)
        user_service = UserService(session, bot, action_service)

        res = await user_service.check_commands_allowed(user_id=message.from_user.id)
        if isinstance(res, MsgErr):
            error = res.error
            await message.answer(error)
            if error == Messages.registration_not_finished():
                await action_service.log_bot_auth(
                    message.from_user.id, status="not_reg_end", ip=None
                )
            elif error == Messages.not_registered():
                await action_service.log_bot_auth(
                    message.from_user.id, status="not_reg_start", ip=None
                )
            return

        user = await get_user_expect(session, message.from_user.id)
        pub_service = PublicationService(session, action_service)

        await message.answer(text=Messages.auth_success(), parse_mode="HTML")

        if not user.items:
            await message.answer(Messages.no_publications_left())
        else:
            publ = await pub_service.assign_current(user.user_id)

            if publ is None:
                logger.warning(
                    "user %d requested his publ while it's none", user.user_id
                )
                publ_id = None
            else:
                await message.answer(
                    text=Messages.current_publication(publ),
                    parse_mode="HTML",
                    disable_web_page_preview=True,
                )
                publ_id = publ.publ_id

            password = generate_secure_password()
            hashed_password = get_password_hash(password)

            await update_user(
                session,
                message.from_user.id,
                UserUpdate(
                    hash=hashed_password,
                    hash_date=datetime.now(),
                    publ_id=publ_id,
                ),
            )

            await message.answer(
                Messages.new_password(password, user.name),
                parse_mode="Markdown",
                disable_web_page_preview=True,
            )

        await update_user(
            session,
            message.from_user.id,
            UserUpdate(reg_stat=UserState.REG_COMPLETED),
        )
        await action_service.log_bot_auth(
            message.from_user.id, status="success", ip=None
        )
