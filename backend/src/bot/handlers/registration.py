from aiogram import Bot, Router
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
from core.exceptions import HandlerError, MsgErr
from core.model import User
from service.user import UserService

router = Router()


@router.message(Command("register"))
async def registration_start(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None:
        raise HandlerError

    async for session in get_session():
        user_service = UserService(session, bot)
        user = await user_service.get(message.from_user.id)

        if not user or user.reg_stat == UserState.DATA_CLEARED:
            if user is not None:
                await message.answer(Messages.old_user(user.name))

            await user_service.start_registration(message.from_user.id)
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
async def reg_accept_agreement(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    async for session in get_session():
        user_service = UserService(session, bot)
        await user_service.accept_agreement(message.from_user.id)

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
async def reg_set_name(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    name_msg = message.text

    async for session in get_session():
        user_service = UserService(session, bot)
        result = await user_service.set_name(message.from_user.id, name_msg)

        if isinstance(result, MsgErr):
            await message.answer(result.error)
            return

    await message.answer(Messages.greeting(name_msg))
    await message.answer(Messages.ask_age())
    await state.set_state(RegistrationStates.waiting_for_age)


@router.message(RegistrationStates.waiting_for_age)
async def reg_set_age(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    age_msg = message.text

    async for session in get_session():
        user_service = UserService(session, bot)
        result = await user_service.set_age(message.from_user.id, age_msg)

        if isinstance(result, MsgErr):
            await message.answer(
                result.error,
                parse_mode="Markdown",
                disable_web_page_preview=True,
            )
            return

    await message.answer(Messages.age_accepted())

    if age_msg.isdigit() and int(age_msg) < 18:
        await message.answer(Messages.age_under_18_warning())

    await message.answer(Messages.ask_publication_preferences())
    await state.set_state(RegistrationStates.waiting_for_preferences)


@router.message(RegistrationStates.waiting_for_preferences)
async def reg_set_preferences(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    comm_msg = message.text.strip()

    async for session in get_session():
        user_service = UserService(session, bot)
        await user_service.set_preferences(message.from_user.id, comm_msg)

    await message.answer(Messages.publication_preferences_accepted(comm_msg))
    await message.answer(Messages.ask_language())
    await state.set_state(RegistrationStates.waiting_for_language)


@router.message(RegistrationStates.waiting_for_language)
async def reg_set_language(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    lang_msg = message.text.strip()

    async for session in get_session():
        user_service = UserService(session, bot)
        result = await user_service.set_language_and_complete(
            message.from_user.id, lang_msg
        )

        if isinstance(result, MsgErr):
            await message.answer(result.error)
            await message.answer(Messages.ask_language())
            return

    await message.answer(Messages.registration_complete())
    await state.clear()
