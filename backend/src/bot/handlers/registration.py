import re
from datetime import datetime

from aiogram import Router
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.messages import Messages
from bot.states import RegistrationStates
from core.dependencies import get_session
from core.enums import UserState
from repository.publication import get_publications_for_language
from repository.user import count_users_with_name, update_user
from schema.user import UserLanguage, UserUpdate

router = Router()

YES_WORDS = ["yes", "да", "принимаю", "ага", "соглашаюсь", "принять", "agree"]
NO_WORDS = ["no", "nope", "нет", "не", "refuse"]


class HandlerError(Exception):
    MSG_INCORRECTLY_CONFIGURED = "incorrectly configured handler"


@router.message(
    RegistrationStates.waiting_for_agreement,
    lambda msg: msg.text and msg.text.lower() in YES_WORDS,
)
async def reg_accept_handler(message: Message, state: FSMContext) -> None:
    if message.from_user is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

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
async def reg_decline_handler(message: Message, state: FSMContext) -> None:
    await message.answer(Messages.maybe_later())
    await state.clear()


@router.message(RegistrationStates.waiting_for_name)
async def reg_name_handler(message: Message, state: FSMContext) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

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
async def reg_age_handler(message: Message, state: FSMContext) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

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
async def reg_prefs_handler(message: Message, state: FSMContext) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

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
async def reg_lang_handler(message: Message, state: FSMContext) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

    lang_msg = message.text.strip().replace(" ", "").replace(",", "").replace(".", "")

    if len(lang_msg) > 1 or lang_msg not in ["1", "2", "3"]:
        await message.answer(Messages.selection_not_recognized())
        await message.answer(Messages.ask_language())
        return

    lang_map: dict[str, UserLanguage] = {"1": "all", "2": "eng", "3": "rus"}
    lang_value = lang_map[lang_msg]

    async for session in get_session():
        items = await get_publications_for_language(session, lang_value)
        items_str = "|".join([str(item) for item in items])

        if not items:
            await message.answer(Messages.no_publication())
            await update_user(
                session,
                message.from_user.id,
                UserUpdate(
                    reg_stat=UserState.REG_COMPLETED,
                    reg_end=datetime.now(),
                ),
            )
            return

        await update_user(
            session,
            message.from_user.id,
            UserUpdate(
                lng=lang_value,
                items=items_str,
                reg_stat=UserState.REG_COMPLETED,
                reg_end=datetime.now(),
            ),
        )

    await message.answer(Messages.registration_complete())
    await state.clear()
