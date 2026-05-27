from aiogram import Bot, Router
from aiogram.filters import Command, or_f
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.constants import NO_WORDS, YES_WORDS
from bot.messages import Messages
from bot.states import SociologyStates
from core.config import settings
from core.dependencies import get_session
from core.enums import UserState
from core.exceptions import HandlerError, MsgErr
from service.actions import ActionService
from service.user import UserService

router = Router()


_FIELD_TO_STATE = {
    "age": UserState.SURVEY_AGE,
    "lng": UserState.SURVEY_LANGUAGE,
    "comm": UserState.SURVEY_PREFERENCES,
    "sex": UserState.SURVEY_SEX,
    "rating": UserState.SURVEY_RATING,
    "region": UserState.SURVEY_REGION,
    "email": UserState.SURVEY_EMAIL,
}

_SURVEY_QUESTIONS = {
    "age": Messages.ask_age(),
    "lng": Messages.ask_language(),
    "comm": Messages.ask_publication_preferences(),
    "sex": Messages.sociology_question(1),
    "rating": Messages.sociology_question(2),
    "region": Messages.ask_region(),
    "email": Messages.ask_email(),
}


async def _progress_survey(
    message: Message,
    user_id: int,
    field: str,
    state: FSMContext,
    bot: Bot,
) -> None:
    data = await state.get_data()
    missing_fields: list[str] = data.get("missing_fields", [])

    if field in missing_fields:
        missing_fields.remove(field)

    async for session in get_session():
        user_service = UserService(session, bot)

        if missing_fields:
            next_field = missing_fields[0]
            next_state = _FIELD_TO_STATE[next_field]

            await user_service.set_state(user_id, next_state)
            await state.update_data(missing_fields=missing_fields)
            await state.set_state(next_state.fsm_state())

            await message.answer(_SURVEY_QUESTIONS[next_field])
            return

        await user_service.update_user_data(
            user_id, reg_stat=UserState.REG_COMPLETED
        )
        await state.clear()

    await message.answer(Messages.sociology_completed())


@router.message(
    or_f(Command("sociology"), lambda msg: msg.text and "опрос" in msg.text.lower())
)
async def sociology_start(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None:
        raise HandlerError

    if message.chat.id == settings.ADMIN_CHAT_ID:
        return

    if message.chat.id < 0:
        return

    user_id = message.from_user.id

    async for session in get_session():
        action_service = ActionService(session)
        user_service = UserService(session, bot, action_service)

        user = await user_service.get(user_id)
        if user is None:
            await message.answer(Messages.not_registered())
            return

        res = await user_service.check_commands_allowed(user=user)
        if isinstance(res, MsgErr):
            await message.answer(res.error)
            return

        missing_fields = user_service.get_missing_survey_fields(user)

        if not missing_fields:
            await message.answer(Messages.sociology_completed())
            return

        await state.update_data(missing_fields=missing_fields)

        first_field = missing_fields[0]
        first_state = _FIELD_TO_STATE[first_field]
        await user_service.set_state(user_id, first_state)
        await state.set_state(first_state.fsm_state())

        await message.answer(_SURVEY_QUESTIONS[first_field])


@router.message(SociologyStates.waiting_for_age)
async def sociology_set_age(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    user_id = message.from_user.id
    age_msg = message.text.strip()

    result = UserService.validate_age_str(age_msg)
    if isinstance(result, MsgErr):
        await message.answer(
            result.error,
            parse_mode="Markdown",
            disable_web_page_preview=True,
        )
        return

    async for session in get_session():
        user_service = UserService(session, bot)
        await user_service.update_user_data(user_id, age=int(age_msg))

    await _progress_survey(message, user_id, "age", state, bot)


@router.message(SociologyStates.waiting_for_language)
async def sociology_set_language(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    lang_msg = message.text.strip()
    user_id = message.from_user.id

    parsed = UserService.parse_language(lang_msg)
    if isinstance(parsed, MsgErr):
        await message.answer(parsed.error)
        return

    async for session in get_session():
        user_service = UserService(session, bot)
        await user_service.update_user_data(user_id, lng=parsed)

    await _progress_survey(message, user_id, "lng", state, bot)


@router.message(SociologyStates.waiting_for_comments)
async def sociology_set_comments(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    user_id = message.from_user.id
    comm_msg = message.text.strip()

    async for session in get_session():
        user_service = UserService(session, bot)
        await user_service.update_user_data(user_id, comm=comm_msg)

    await _progress_survey(message, user_id, "comm", state, bot)


@router.message(SociologyStates.waiting_for_gender)
async def sociology_set_gender(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    user_id = message.from_user.id
    gender_msg = message.text.lower()

    if "жен" in gender_msg or "female" in gender_msg:
        gender_value = "ff"
    elif "муж" in gender_msg or "male" in gender_msg:
        gender_value = "mm"
    else:
        await message.answer(Messages.selection_not_recognized())
        return

    async for session in get_session():
        user_service = UserService(session, bot)
        await user_service.update_user_data(user_id, sex=gender_value)

    await _progress_survey(message, user_id, "sex", state, bot)


@router.message(SociologyStates.waiting_for_rating_agreement)
async def sociology_set_rating(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    user_id = message.from_user.id
    answer = message.text.lower()

    if answer in YES_WORDS:
        rating_value = 1
    elif answer in NO_WORDS:
        rating_value = 0
    else:
        await message.answer(Messages.selection_not_recognized())
        return

    async for session in get_session():
        user_service = UserService(session, bot)
        await user_service.update_user_data(user_id, rating=rating_value)

    await _progress_survey(message, user_id, "rating", state, bot)


@router.message(SociologyStates.waiting_for_region)
async def sociology_set_region(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    user_id = message.from_user.id
    region_msg = message.text.strip()

    if len(region_msg) < 3:
        await message.answer(Messages.message_too_short())
        return

    async for session in get_session():
        user_service = UserService(session, bot)
        await user_service.update_user_data(user_id, region=region_msg)

    await _progress_survey(message, user_id, "region", state, bot)


@router.message(SociologyStates.waiting_for_email)
async def sociology_set_email(message: Message, state: FSMContext, bot: Bot) -> None:
    if message.from_user is None or message.text is None:
        raise HandlerError

    user_id = message.from_user.id
    email_msg = message.text.strip().lower()

    if "@" not in email_msg or "." not in email_msg:
        await message.answer(Messages.not_email())
        return

    async for session in get_session():
        user_service = UserService(session, bot)
        await user_service.update_user_data(user_id, email=email_msg)

    await _progress_survey(message, user_id, "email", state, bot)
