from datetime import datetime

from aiogram import Bot, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from api.auth.login import logger
from bot.button_markups import Keyboards
from bot.generate_pass import generate_secure_password
from bot.messages import Messages
from bot.states import RegistrationStates
from core.config import settings
from core.dependencies import get_session
from core.enums import UserState
from core.exceptions import MsgErr
from core.model import User
from core.security import get_password_hash
from repository.publication import user_filled_publication
from repository.user import create_user, get_user_expect, update_user
from schema.common import ProcessingLevel
from schema.user import UserUpdate
from service.actions import ActionService
from service.publications import PublicationService
from service.user import UserService

router = Router()


class HandlerError(Exception):
    MSG_INCORRECTLY_CONFIGURED = "incorrectly configured handler"


@router.message(Command("start"))
async def start_command(message: Message) -> None:
    if message.from_user is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    await message.answer(
        Messages.start(message.from_user.first_name),
        parse_mode="HTML",
        disable_web_page_preview=True,
        reply_markup=Keyboards.remove(),
    )


@router.message(Command("register"))
async def register_command(message: Message, state: FSMContext) -> None:
    if message.from_user is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    async for session in get_session():
        user = await get_user_expect(session, message.from_user.id)

        if not user:
            await create_user(
                session,
                user_id=message.from_user.id,
                reg_stat=UserState.REG_AGREEMENT,
            )
            await message.answer(
                Messages.registration_start(),
                reply_markup=Keyboards.yes_no(),
                parse_mode="HTML",
                disable_web_page_preview=True,
            )
            await state.set_state(RegistrationStates.waiting_for_agreement)
        elif user.reg_stat == UserState.DATA_CLEARED:
            await update_user(
                session,
                message.from_user.id,
                UserUpdate(reg_stat=UserState.REG_AGREEMENT),
            )

            await message.answer(Messages.old_user(user.name))

            await message.answer(
                Messages.registration_start(),
                reply_markup=Keyboards.yes_no(),
                parse_mode="HTML",
                disable_web_page_preview=True,
            )
            await state.set_state(RegistrationStates.waiting_for_agreement)
        elif user.reg_stat == UserState.REG_COMPLETED:
            await message.answer(
                Messages.already_registered(user.name),
                reply_markup=Keyboards.remove(),
            )
        elif user.reg_stat == UserState.SUPPORT:
            await message.answer(Messages.support_call_not_finished())
        else:
            await continue_registration(message, user, state)


async def continue_registration(
    message: Message, user: User, state: FSMContext
) -> None:
    if message.chat.id == settings.ADMIN_CHAT_ID:
        return
    reg_stat = user.reg_stat

    if reg_stat == UserState.SUPPORT:
        await message.answer(Messages.support_call_not_finished())
    elif reg_stat == UserState.REG_AGREEMENT:
        await state.set_state(RegistrationStates.waiting_for_agreement)
        await message.answer(
            Messages.registration_start(),
            reply_markup=Keyboards.yes_no(),
            parse_mode="HTML",
            disable_web_page_preview=True,
        )
    elif reg_stat == UserState.REG_NAME:
        await state.set_state(RegistrationStates.waiting_for_name)
        await message.answer(Messages.ask_name(), reply_markup=Keyboards.remove())
    elif reg_stat == UserState.REG_AGE:
        await state.set_state(RegistrationStates.waiting_for_age)
        await message.answer(Messages.ask_age(), reply_markup=Keyboards.remove())
        if getattr(user, "age", 0) < 18:
            await message.answer(Messages.age_under_18_warning())
    elif reg_stat == UserState.REG_PREFERENCES:
        await state.set_state(RegistrationStates.waiting_for_preferences)
        await message.answer(
            Messages.ask_publication_preferences(), reply_markup=Keyboards.remove()
        )
    elif reg_stat == UserState.REG_LANGUAGE:
        await state.set_state(RegistrationStates.waiting_for_language)
        await message.answer(
            Messages.ask_language(), reply_markup=Keyboards.language_selection()
        )
    else:
        await state.clear()
        await message.answer(
            Messages.unexpected_error(), reply_markup=Keyboards.remove()
        )


@router.message(Command("auth"))
async def auth_command(message: Message, bot: Bot) -> None:
    if message.from_user is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    async for session in get_session():
        action_service = ActionService(session)
        user_service = UserService(session, bot, action_service)

        res = await user_service.check_command_allowed(message.from_user.id)
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
                raise Exception

            await message.answer(
                text=Messages.current_publication(publ),
                parse_mode="HTML",
                disable_web_page_preview=True,
            )

            password = generate_secure_password()
            hashed_password = get_password_hash(password)

            await update_user(
                session,
                message.from_user.id,
                UserUpdate(
                    hash=hashed_password,
                    hash_date=datetime.now(),
                    publ_id=publ.id,
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


@router.message(Command("next_publ"))
async def next_publ_command(message: Message, bot: Bot) -> None:
    if message.from_user is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    async for session in get_session():
        action_service = ActionService(session)
        user_service = UserService(session, bot, action_service)

        res = await user_service.check_command_allowed(message.from_user.id)
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

        if user.publ_id is None:
            await message.answer(Messages.not_authorization())
            return

        pub_service = PublicationService(session, action_service)

        if not await user_filled_publication(
            session, message.from_user.id, user.publ_id
        ):
            await message.answer(Messages.not_finished_publ(user.name))
            return

        next_publ = await pub_service.complete(
            user.user_id, user.publ_id, ProcessingLevel.SKIP, None
        )

        if next_publ is not None:
            await message.answer(Messages.accept_next_publ())

            await message.answer(
                text=Messages.current_publication(next_publ),
                parse_mode="HTML",
                disable_web_page_preview=True,
            )
        else:
            await message.answer(Messages.no_publications_left())
