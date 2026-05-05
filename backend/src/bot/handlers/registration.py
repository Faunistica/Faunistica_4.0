import re
from datetime import datetime

from aiogram import Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot import keyboards
from bot.constants import NO_WORDS, YES_WORDS
from bot.messages import Messages
from bot.states import RegistrationStates
from core.config import settings
from core.dependencies import get_session
from core.enums import UserState
from core.exceptions import HandlerError
from core.model import User
from repository.user import (
    count_users_with_name,
    create_user_or_update,
    get_user,
    update_user,
)
from schema.user import UserLanguage, UserUpdate

router = Router()


@router.message(Command("register"))
async def registration_start(message: Message, state: FSMContext) -> None:
    if message.from_user is None:
        raise HandlerError

    async for session in get_session():
        user = await get_user(session, message.from_user.id)

        if not user or user.reg_stat == UserState.DATA_CLEARED:
            if user is not None:
                await message.answer(Messages.old_user(user.name))

            await create_user_or_update(
                session,
                user_id=message.from_user.id,
                reg_stat=UserState.REG_AGREEMENT,
            )
            await message.answer(
                Messages.registration_start(),
                reply_markup=keyboards.yes_no(),
                parse_mode="HTML",
                disable_web_page_preview=True,
            )
            await state.set_state(RegistrationStates.waiting_for_agreement)
        elif user.reg_stat == UserState.REG_COMPLETED:
            await message.answer(
                Messages.already_registered(user.name),
                reply_markup=keyboards.remove(),
            )
        elif user.reg_stat == UserState.SUPPORT:
            await message.answer(Messages.support_flow_not_finished())
        else:
            await continue_registration(message, user, state)


async def continue_registration(
    message: Message, user: User, state: FSMContext
) -> None:
    if message.chat.id == settings.ADMIN_CHAT_ID:
        return
    reg_stat = user.reg_stat

    if reg_stat == UserState.SUPPORT:
        await message.answer(Messages.support_flow_not_finished())
    elif reg_stat == UserState.REG_AGREEMENT:
        await state.set_state(RegistrationStates.waiting_for_agreement)
        await message.answer(
            Messages.registration_start(),
            reply_markup=keyboards.yes_no(),
            parse_mode="HTML",
            disable_web_page_preview=True,
        )
    elif reg_stat == UserState.REG_NAME:
        await state.set_state(RegistrationStates.waiting_for_name)
        await message.answer(Messages.ask_name(), reply_markup=keyboards.remove())
    elif reg_stat == UserState.REG_AGE:
        await state.set_state(RegistrationStates.waiting_for_age)
        await message.answer(Messages.ask_age(), reply_markup=keyboards.remove())
        if not user.age or user.age < 18:
            await message.answer(Messages.age_under_18_warning())
    elif reg_stat == UserState.REG_PREFERENCES:
        await state.set_state(RegistrationStates.waiting_for_preferences)
        await message.answer(
            Messages.ask_publication_preferences(), reply_markup=keyboards.remove()
        )
    elif reg_stat == UserState.REG_LANGUAGE:
        await state.set_state(RegistrationStates.waiting_for_language)
        await message.answer(
            Messages.ask_language(), reply_markup=keyboards.language_selection()
        )
    else:
        await state.clear()
        await message.answer(
            Messages.unexpected_error(), reply_markup=keyboards.remove()
        )


@router.message(
    RegistrationStates.waiting_for_agreement,
    lambda msg: msg.text and msg.text.lower() in YES_WORDS,
)
async def reg_accept_agreement(message: Message, state: FSMContext) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    async for session in get_session():
        await update_user(
            session, message.from_user.id, UserUpdate(reg_stat=UserState.REG_NAME)
        )

    await message.answer(Messages.consent_taken())
    await message.answer(Messages.ask_name())
    await state.set_state(RegistrationStates.waiting_for_name)


@router.message(
    RegistrationStates.waiting_for_agreement,
    lambda msg: msg.text and msg.text.lower() in NO_WORDS,
)
async def reg_decline_agreement(message: Message, state: FSMContext) -> None:
    await message.answer(Messages.maybe_later())
    await state.clear()


@router.message(RegistrationStates.waiting_for_name)
async def reg_set_name(message: Message, state: FSMContext) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    name_msg = message.text

    async for session in get_session():
        other_users = await count_users_with_name(session, name_msg)

        if other_users > 0:
            await message.answer(Messages.name_already_exists())
        elif len(name_msg) < 3:
            await message.answer(Messages.message_too_short())
        elif len(name_msg) > 40:
            await message.answer(Messages.message_too_long())
        elif not re.fullmatch(r"^[а-яА-ЯёЁa-zA-Z0-9\s\-'.]+$", name_msg):
            await message.answer(Messages.invalid_characters())
        else:
            await update_user(
                session,
                message.from_user.id,
                UserUpdate(
                    name=name_msg,
                    reg_stat=UserState.REG_AGE,
                ),
            )
            await message.answer(Messages.greeting(name_msg))
            await message.answer(Messages.ask_age())
            await state.set_state(RegistrationStates.waiting_for_age)


@router.message(RegistrationStates.waiting_for_age)
async def reg_set_age(message: Message, state: FSMContext) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    age_msg = message.text

    if len(age_msg) > 5:
        await message.answer(Messages.message_too_long())
    elif not age_msg.isdigit():
        await message.answer(Messages.message_no_digits())
    elif int(age_msg) > 99:
        await message.answer(
            Messages.age_too_high(),
            parse_mode="Markdown",
            disable_web_page_preview=True,
        )
    elif int(age_msg) < 14:
        await message.answer(Messages.age_too_low())
    else:
        async for session in get_session():
            await update_user(
                session,
                message.from_user.id,
                UserUpdate(
                    age=int(age_msg),
                    reg_stat=UserState.REG_PREFERENCES,
                ),
            )
        await message.answer(Messages.age_accepted())

        if int(age_msg) < 18:
            await message.answer(Messages.age_under_18_warning())

        await message.answer(Messages.ask_publication_preferences())
        await state.set_state(RegistrationStates.waiting_for_preferences)


@router.message(RegistrationStates.waiting_for_preferences)
async def reg_set_preferences(message: Message, state: FSMContext) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    comm_msg = message.text.strip()

    async for session in get_session():
        await update_user(
            session,
            message.from_user.id,
            UserUpdate(comm=comm_msg, reg_stat=UserState.REG_LANGUAGE),
        )

    await message.answer(Messages.publication_preferences_accepted(comm_msg))
    await message.answer(Messages.ask_language())
    await state.set_state(RegistrationStates.waiting_for_language)


@router.message(RegistrationStates.waiting_for_language)
async def reg_set_language(message: Message, state: FSMContext) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    lang_msg = message.text.strip().replace(" ", "").replace(",", "").replace(".", "")

    if len(lang_msg) > 1 or lang_msg not in ["1", "2", "3"]:
        await message.answer(Messages.selection_not_recognized())
        await message.answer(Messages.ask_language())
        return

    lang_map: dict[str, UserLanguage] = {"1": "all", "2": "eng", "3": "rus"}
    lang_value = lang_map[lang_msg]

    async for session in get_session():
        await update_user(
            session,
            message.from_user.id,
            UserUpdate(
                lng=lang_value,
                reg_stat=UserState.REG_COMPLETED,
                reg_end=datetime.now(),
            ),
        )

    await message.answer(Messages.registration_complete())
    await state.clear()
