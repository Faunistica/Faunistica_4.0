import re
from datetime import datetime
from pathlib import Path

from aiogram import Bot, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import FSInputFile, Message

from api.auth.login import logger
from bot.button_markups import Keyboards
from bot.generate_pass import generate_secure_password
from bot.messages import Messages
from bot.states import RegistrationStates, RenameStates, SociologyStates, SupportStates
from core.config import settings
from core.database import get_session
from core.enums import UserState
from core.exceptions import MsgErr
from core.model import User
from core.security import get_password_hash
from repository.publication import (
    get_publications_for_language,
    user_filled_publication,
)
from repository.stats import (
    get_project_statistics,
    get_user_statistics,
    get_volunteers_achievements,
)
from repository.user import (
    count_users_with_name,
    create_user,
    get_user_expect,
    update_user,
)
from schema.common import ProcessingLevel
from schema.user import UserLanguage, UserUpdate
from service.actions import ActionService
from service.publications import PublicationService
from service.user import UserService

YES_WORDS = ["yes", "да", "принимаю", "ага", "соглашаюсь", "принять", "agree"]
NO_WORDS = ["no", "nope", "нет", "не", "refuse"]


class HandlerError(Exception):
    """Custom exception for handler errors."""

    MSG_INCORRECTLY_CONFIGURED = "incorrectly configured handler"

    pass


class Handlers:
    def __init__(self, bot: Bot) -> None:
        self.bot = bot
        self.db_session_factory = get_session
        self.router = Router()
        self.register_handlers()

    def register_handlers(self) -> None:
        self.router.message.register(self.start_command, Command("start"))
        self.router.message.register(self.register_command, Command("register"))
        self.router.message.register(self.auth_command, Command("auth"))
        self.router.message.register(self.next_publ_command, Command("next_publ"))
        self.router.message.register(self.menu_command, Command("menu"))
        self.router.message.register(self.stats_command, Command("stats"))
        self.router.message.register(self.rename_command, Command("rename"))
        self.router.message.register(self.support_command, Command("support"))
        self.router.message.register(self.sociology_command, Command("sociology"))
        self.router.message.register(self.cancel_command, Command("cancel"))
        self.router.message.register(self.reply_to_user_command, Command("reply"))
        self.router.message.register(self.send_logs_command, Command("logs"))

        self.router.message.register(
            self.menu_command, lambda msg: "меню" in msg.text.lower()
        )
        self.router.message.register(
            self.sociology_command, lambda msg: "опрос" in msg.text.lower()
        )

        self.router.message.register(
            self.reg_accept_handler,
            lambda msg: msg.text.lower() in YES_WORDS,
            RegistrationStates.waiting_for_agreement,
        )
        self.router.message.register(
            self.reg_decline_handler,
            lambda msg: msg.text.lower() in NO_WORDS,
            RegistrationStates.waiting_for_agreement,
        )
        self.router.message.register(
            self.reg_name_handler, RegistrationStates.waiting_for_name
        )
        self.router.message.register(
            self.reg_age_handler, RegistrationStates.waiting_for_age
        )
        self.router.message.register(
            self.reg_prefs_handler, RegistrationStates.waiting_for_preferences
        )
        self.router.message.register(
            self.reg_lang_handler, RegistrationStates.waiting_for_language
        )

        self.router.message.register(
            self.support_question_handler, SupportStates.waiting_for_question
        )

        self.router.message.register(
            self.rename_name_handler, RenameStates.waiting_for_new_name
        )

        self.router.message.register(
            self.sociology_age_handler, SociologyStates.waiting_for_age
        )
        self.router.message.register(
            self.sociology_lang_handler, SociologyStates.waiting_for_language
        )
        self.router.message.register(
            self.sociology_comments_handler, SociologyStates.waiting_for_comments
        )
        self.router.message.register(
            self.sociology_gender_handler, SociologyStates.waiting_for_gender
        )
        self.router.message.register(
            self.sociology_rating_handler, SociologyStates.waiting_for_rating_agreement
        )
        self.router.message.register(
            self.sociology_region_handler, SociologyStates.waiting_for_region
        )
        self.router.message.register(
            self.sociology_email_handler, SociologyStates.waiting_for_email
        )

        self.router.message.register(self.other_content_handler)

    # ========== COMMAND HANDLERS ========== #

    async def start_command(self, message: Message) -> None:
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

    async def register_command(self, message: Message, state: FSMContext) -> None:
        if message.from_user is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        if message.chat.id == settings.ADMIN_CHAT_ID:
            return

        async for session in self.db_session_factory():
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
                await self.continue_registration(message, user, state)

    async def auth_command(self, message: Message) -> None:
        if message.from_user is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        if message.chat.id == settings.ADMIN_CHAT_ID:
            return

        async for session in self.db_session_factory():
            action_service = ActionService(session)
            user_service = UserService(session, self.bot, action_service)

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
                # Use assign_current to get next publication from queue
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

    async def next_publ_command(self, message: Message) -> None:
        if message.from_user is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        if message.chat.id == settings.ADMIN_CHAT_ID:
            return

        async for session in self.db_session_factory():
            action_service = ActionService(session)
            user_service = UserService(session, self.bot, action_service)

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

            # Check if user filled the current publication
            if not await user_filled_publication(
                session, message.from_user.id, user.publ_id
            ):
                await message.answer(Messages.not_finished_publ(user.name))
                return

            # Use complete() to properly log the action and advance queue
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

    async def menu_command(self, message: Message) -> None:
        if message.chat.id == settings.ADMIN_CHAT_ID:
            return

        await message.answer(Messages.called_menu(), parse_mode="HTML")

    async def stats_command(self, message: Message) -> None:
        if message.from_user is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        if message.chat.id == settings.ADMIN_CHAT_ID:
            return

        async for session in self.db_session_factory():
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

            if message.chat.id == settings.ADMIN_CHAT_ID:
                await get_volunteers_achievements(session)
                # NOTE: IN DEVELOPMENT

    async def rename_command(self, message: Message, state: FSMContext) -> None:
        if message.from_user is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        if message.chat.id == settings.ADMIN_CHAT_ID:
            return

        async for session in self.db_session_factory():
            action_service = ActionService(session)
            user_service = UserService(session, self.bot, action_service)

            res = await user_service.check_command_allowed(message.from_user.id)
            if isinstance(res, MsgErr):
                await message.answer(res.error)
                return

            # check_command_allowed handles most cases, but rename has special logic
            # for survey check - need to handle that separately
            user = await get_user_expect(session, message.from_user.id)
            if user.reg_stat.is_in_survey():
                await message.answer(Messages.sociology_not_finished())
                return

            await message.answer(
                Messages.rename_prompt(), reply_markup=Keyboards.remove()
            )
            await state.set_state(RenameStates.waiting_for_new_name)

    async def support_command(self, message: Message, state: FSMContext) -> None:
        if message.from_user is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        if message.chat.id == settings.ADMIN_CHAT_ID:
            await message.answer(Messages.support_for_admins())
            return

        async for session in self.db_session_factory():
            action_service = ActionService(session)
            user_service = UserService(session, self.bot, action_service)

            res = await user_service.check_command_allowed(message.from_user.id)
            if isinstance(res, MsgErr):
                await message.answer(res.error)
                return

        async for session in self.db_session_factory():
            await update_user(
                session, message.from_user.id, UserUpdate(reg_stat=UserState.SUPPORT)
            )
        await message.answer(
            Messages.support_request(), reply_markup=Keyboards.remove()
        )
        await state.set_state(SupportStates.waiting_for_question)

    async def sociology_command(self, message: Message, state: FSMContext) -> None:  # noqa: PLR0912
        if message.from_user is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        if message.chat.id == settings.ADMIN_CHAT_ID:
            return

        if message.chat.id < 0:
            return

        async for session in self.db_session_factory():
            user = await get_user_expect(session, message.from_user.id)

            res = await UserService(
                session, self.bot, ActionService(session)
            ).check_command_allowed(message.from_user.id)

            if isinstance(res, MsgErr):
                await message.answer(res.error)
                return

            if all(
                getattr(user, field) is not None
                for field in ["age", "lng", "comm", "sex", "rating"]
            ):
                await message.answer(Messages.sociology_completed())
            else:
                missing_fields = [
                    field
                    for field in ["age", "lng", "comm", "sex", "rating"]
                    if getattr(user, field) is None
                ]

                await message.answer(
                    f"{Messages.any_question(missing_fields)}\n{Messages.go_back_to_sociology()}",
                    parse_mode="HTML",
                )

                next_question = missing_fields[0]

                if next_question == "age":
                    await message.answer(Messages.ask_age())
                    await state.set_state(SociologyStates.waiting_for_age)
                elif next_question == "lng":
                    await message.answer(Messages.ask_language())
                    await state.set_state(SociologyStates.waiting_for_language)
                elif next_question == "comm":
                    await message.answer(Messages.ask_publication_preferences())
                    await state.set_state(SociologyStates.waiting_for_comments)
                elif next_question == "sex":
                    await message.answer(Messages.sociology_question(1))
                    await state.set_state(SociologyStates.waiting_for_gender)
                elif next_question == "rating":
                    await message.answer(Messages.sociology_question(2))
                    await state.set_state(SociologyStates.waiting_for_rating_agreement)

    async def cancel_command(self, message: Message, state: FSMContext) -> None:
        if message.from_user is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        if message.chat.id == settings.ADMIN_CHAT_ID:
            return

        async for session in self.db_session_factory():
            action_service = ActionService(session)
            user_service = UserService(session, self.bot, action_service)

            res = await user_service.check_command_allowed(message.from_user.id)
            if isinstance(res, MsgErr):
                await message.answer(res.error)
                return

            await state.clear()

            await update_user(
                session,
                message.from_user.id,
                UserUpdate(reg_stat=UserState.REG_COMPLETED),
            )

        await message.answer(
            Messages.rollback_completed(), reply_markup=Keyboards.remove()
        )

    async def reply_to_user_command(self, message: Message) -> None:
        if message.text is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        if message.chat.id != settings.ADMIN_CHAT_ID:
            await message.answer(Messages.no_access_to_command())
            return

        if message.reply_to_message is None or message.reply_to_message.text is None:
            await message.answer(Messages.using_command_reply())
            return

        reply_text = (
            message.text.replace("/reply@FaunisticaV3Bot", "")
            .replace("/reply", "")
            .strip()
        )
        if not reply_text:
            await message.answer(Messages.empty_response_to_user())
            return

        original_message = message.reply_to_message.text
        try:
            user_id = int(
                original_message.replace("\n", " ").split("ID: ")[1].split(" ")[0]
            )
        except (IndexError, ValueError):
            await message.answer(Messages.could_not_extract_id())
            return

        await self.bot.send_message(user_id, Messages.response_from_support(reply_text))
        await message.answer(Messages.response_sent())

    # NOTE: do we need this?
    async def send_logs_command(self, message: Message) -> None:
        if message.text is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        if message.chat.id != settings.ADMIN_CHAT_ID:
            await message.answer(Messages.no_access_to_command())
            return

        args = message.text.split(maxsplit=1)
        if len(args) < 2:
            await message.answer(Messages.incorrect_date())
            return

        date_str = args[1]
        try:
            files_to_send = await self._get_log_files(date_str)

            if len(files_to_send) == 0:
                await message.answer(Messages.logs_not_found(date_str))

                dates = set()
                logs_dir = settings.LOGS_DIR
                for file in logs_dir.glob("*.log*"):
                    try:
                        date_part = file.name.split(".")[-1]
                        datetime.strptime(date_part, "%Y-%m-%d")
                        dates.add(f"\n{date_part}")
                    except ValueError:
                        continue

                await message.answer(Messages.available_log_dates(dates))
                return

            for name, path in files_to_send:
                await message.answer_document(
                    document=FSInputFile(path, filename=f"{name}.{date_str}"),
                    caption=f"{name} за {date_str}",
                )

        except ValueError:
            await message.answer(Messages.incorrect_date())
        except Exception:
            await message.answer(Messages.unexpected_error())

    async def _get_log_files(self, date_str: str) -> list[tuple[str, Path]]:
        logs_dir = settings.LOGS_DIR
        if date_str.lower() == "сегодня":
            service_log = logs_dir / "service.log"
            errors_log = logs_dir / "errors.log"
        else:
            date = datetime.strptime(date_str, "%Y-%m-%d")
            date_str = date.strftime("%Y-%m-%d")

            service_log = logs_dir / f"service.log.{date_str}"
            errors_log = logs_dir / f"errors.log.{date_str}"

        files_to_send: list[tuple[str, Path]] = []
        if service_log.exists():
            files_to_send.append(("service.log", service_log))

        if errors_log.exists():
            files_to_send.append(("errors.log", errors_log))

        return files_to_send

    # ========== STATE HANDLERS ========== #

    async def continue_registration(
        self, message: Message, user: User, state: FSMContext
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

    async def reg_accept_handler(self, message: Message, state: FSMContext) -> None:
        if message.from_user is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        async for session in self.db_session_factory():
            await update_user(
                session, message.from_user.id, UserUpdate(reg_stat=UserState.REG_NAME)
            )

        await message.answer(Messages.consent_taken())
        await message.answer(Messages.ask_name())
        await state.set_state(RegistrationStates.waiting_for_name)

    async def reg_decline_handler(self, message: Message, state: FSMContext) -> None:
        await message.answer(Messages.maybe_later())
        await state.clear()

    async def reg_name_handler(self, message: Message, state: FSMContext) -> None:
        if message.from_user is None or message.text is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        name_msg = message.text

        async for session in self.db_session_factory():
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

    async def reg_age_handler(self, message: Message, state: FSMContext) -> None:
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
            async for session in self.db_session_factory():
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

    async def reg_prefs_handler(self, message: Message, state: FSMContext) -> None:
        if message.from_user is None or message.text is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        comm_msg = message.text.strip()

        async for session in self.db_session_factory():
            await update_user(
                session,
                message.from_user.id,
                UserUpdate(comm=comm_msg, reg_stat=UserState.REG_LANGUAGE),
            )
        await message.answer(Messages.publication_preferences_accepted(comm_msg))
        await message.answer(Messages.ask_language())
        await state.set_state(RegistrationStates.waiting_for_language)

    async def reg_lang_handler(self, message: Message, state: FSMContext) -> None:
        if message.from_user is None or message.text is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        lang_msg = (
            message.text.strip().replace(" ", "").replace(",", "").replace(".", "")
        )

        if len(lang_msg) > 1 or lang_msg not in ["1", "2", "3"]:
            await message.answer(Messages.selection_not_recognized())
            await message.answer(Messages.ask_language())
            return

        lang_map: dict[str, UserLanguage] = {"1": "all", "2": "eng", "3": "rus"}
        lang_value = lang_map[lang_msg]

        async for session in self.db_session_factory():
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
        # FIXME: this was in original code, idk what this is supposed to mean
        # await message.answer(Messages.auth_prompt())
        await state.clear()

    async def support_question_handler(
        self, message: Message, state: FSMContext
    ) -> None:
        if (
            message.from_user is None
            or message.from_user.username is None
            or message.text is None
        ):
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        if message.text.lower().strip() in ["cancel", "отмена"]:
            await message.answer(Messages.cancellation_support_request())
            async for session in self.db_session_factory():
                await update_user(
                    session,
                    message.from_user.id,
                    UserUpdate(reg_stat=UserState.REG_COMPLETED),
                )

            await state.clear()
            return
        if len(message.text) < 10:
            await message.answer(Messages.support_request_too_short())
            return
        if len(message.text) > 256:
            await message.answer(Messages.message_too_long())
            return

        async for session in self.db_session_factory():
            await update_user(
                session,
                message.from_user.id,
                UserUpdate(reg_stat=UserState.REG_COMPLETED),
            )

        await message.answer(
            Messages.support_request_received(),
            reply_markup=Keyboards.remove(),
            parse_mode="HTML",
        )

        await self.bot.send_message(
            chat_id=settings.ADMIN_CHAT_ID,
            text=Messages.request_for_support(
                message.from_user.username, message.from_user.id, message.text
            ),
        )

        await state.clear()

    async def rename_name_handler(self, message: Message, state: FSMContext) -> None:
        if message.from_user is None or message.text is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        name_msg = message.text

        # FIXME: isn't it just better to set username as UNIQUE in db
        # and handle errors if they appear?
        async for session in self.db_session_factory():
            action_service = ActionService(session)
            other_users = await count_users_with_name(session, name_msg)

            if name_msg == (await get_user_expect(session, message.from_user.id)).name:
                await message.answer(Messages.same_name(name_msg))
            elif other_users > 0:
                await message.answer(Messages.name_already_exists())
            elif len(name_msg) < 3:
                await message.answer(Messages.message_too_short())
            elif len(name_msg) > 40:
                await message.answer(Messages.message_too_long())
            elif not re.fullmatch(r"^[а-яА-ЯёЁa-zA-Z0-9\s\-'.]+$", name_msg):
                await message.answer(Messages.invalid_characters())
            else:
                old_name = (await get_user_expect(session, message.from_user.id)).name

                await action_service.log_bot_rename(
                    message.from_user.id, old=old_name, new=name_msg, ip=None
                )

                await update_user(
                    session,
                    message.from_user.id,
                    UserUpdate(
                        name=name_msg,
                        reg_stat=UserState.REG_COMPLETED,
                    ),
                )

                await message.answer(Messages.rename_success(name_msg))
                await state.clear()

    # Sociology state handlers
    async def sociology_age_handler(self, message: Message, state: FSMContext) -> None:
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
            async for session in self.db_session_factory():
                await update_user(
                    session,
                    message.from_user.id,
                    UserUpdate(
                        age=int(age_msg),
                        reg_stat=UserState.REG_COMPLETED,
                    ),
                )
            await message.answer(Messages.age_accepted())

            if int(age_msg) < 18:
                await message.answer(Messages.age_under_18_warning())

            await message.answer(Messages.go_back_to_sociology())
            await state.clear()

    async def sociology_lang_handler(self, message: Message, state: FSMContext) -> None:
        if message.from_user is None or message.text is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        lang_msg = (
            message.text.strip().replace(" ", "").replace(",", "").replace(".", "")
        )

        if len(lang_msg) > 1 or lang_msg not in ["1", "2", "3"]:
            await message.answer(Messages.selection_not_recognized())
            return

        lang_map: dict[str, UserLanguage] = {"1": "all", "2": "eng", "3": "rus"}
        lang_value = lang_map[lang_msg]

        async for session in self.db_session_factory():
            await update_user(
                session,
                message.from_user.id,
                UserUpdate(
                    lng=lang_value,
                    reg_stat=UserState.REG_COMPLETED,
                ),
            )

        await message.answer(Messages.language_selection_accepted())
        await message.answer(Messages.go_back_to_sociology())
        await state.clear()

    async def sociology_comments_handler(
        self, message: Message, state: FSMContext
    ) -> None:
        if message.from_user is None or message.text is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        comm_msg = message.text.strip()
        async for session in self.db_session_factory():
            await update_user(
                session,
                message.from_user.id,
                UserUpdate(comm=comm_msg, reg_stat=UserState.REG_COMPLETED),
            )
        await message.answer(Messages.publication_preferences_accepted(comm_msg))
        await message.answer(Messages.go_back_to_sociology())
        await state.clear()

    async def sociology_gender_handler(
        self, message: Message, state: FSMContext
    ) -> None:
        if message.from_user is None or message.text is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        gender_msg = message.text.lower()

        if "жен" in gender_msg or "female" in gender_msg:
            gender_value = "ff"
        elif "муж" in gender_msg or "male" in gender_msg:
            gender_value = "mm"
        else:
            await message.answer(Messages.selection_not_recognized())
            return

        async for session in self.db_session_factory():
            await update_user(
                session,
                message.from_user.id,
                UserUpdate(
                    sex=gender_value,
                    reg_stat=UserState.REG_COMPLETED,
                ),
            )

        await message.answer(Messages.gratitude())
        await message.answer(Messages.go_back_to_sociology())
        await state.clear()

    async def sociology_rating_handler(
        self, message: Message, state: FSMContext
    ) -> None:
        if message.from_user is None or message.text is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        answer = message.text.lower()

        if answer in YES_WORDS:
            rating_value = 1
        elif answer in NO_WORDS:
            rating_value = 0
        else:
            await message.answer(Messages.selection_not_recognized())
            return

        async for session in self.db_session_factory():
            await update_user(
                session,
                message.from_user.id,
                UserUpdate(
                    rating=rating_value,
                    reg_stat=UserState.REG_COMPLETED,
                ),
            )

        await message.answer(Messages.gratitude())
        await message.answer(Messages.go_back_to_sociology())
        await state.clear()

    async def sociology_region_handler(
        self, message: Message, state: FSMContext
    ) -> None:
        if message.from_user is None or message.text is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        region_msg = message.text.strip()

        if len(region_msg) < 3:
            await message.answer(Messages.message_too_short())
            return

        async for session in self.db_session_factory():
            await update_user(
                session,
                message.from_user.id,
                UserUpdate(
                    region=region_msg,
                    reg_stat=UserState.REG_COMPLETED,
                ),
            )

        await message.answer(Messages.region_accepted())
        await message.answer(Messages.go_back_to_sociology())
        await state.clear()

    async def sociology_email_handler(
        self, message: Message, state: FSMContext
    ) -> None:
        if message.from_user is None or message.text is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        email_msg = message.text.strip().lower()

        if "@" not in email_msg or "." not in email_msg:
            await message.answer(Messages.not_email())
            return

        async for session in self.db_session_factory():
            await update_user(
                session,
                message.from_user.id,
                UserUpdate(
                    email=email_msg,
                    reg_stat=UserState.REG_COMPLETED,
                ),
            )

        await message.answer(Messages.email_accepted())
        await message.answer(Messages.sociology_completed())
        await state.clear()

    # ========== OTHER HANDLERS ========== #

    async def other_content_handler(self, message: Message) -> None:
        if message.from_user is None:
            raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

        if message.chat.id == settings.ADMIN_CHAT_ID:
            return

        async for session in self.db_session_factory():
            action_service = ActionService(session)
            await action_service.log_bot_other(
                message.from_user.id, content_type=message.content_type, ip=None
            )
        await message.answer(
            Messages.unknown_content(), reply_markup=Keyboards.remove()
        )
