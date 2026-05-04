import logging
import re
from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from aiogram import Bot
from aiogram.fsm.context import FSMContext
from asyncpg.compat import StrEnum
from sqlalchemy.ext.asyncio import AsyncSession

from bot.messages import Messages
from core.config import settings
from core.enums import UserState
from core.exceptions import ExpectationError, MsgErr, Ok
from core.model import User
from repository.publication import get_publications_for_language
from repository.user import count_users_with_name, get_user_expect, update_user
from schema.user import UserLanguage, UserUpdate
from service.actions import ActionService

YES_WORDS = ["yes", "да", "принимаю", "ага", "соглашаюсь", "принять", "agree"]
NO_WORDS = ["no", "nope", "нет", "не", "refuse"]

logger = logging.getLogger(__name__)


class FlowType(StrEnum):
    REGISTRATION = "registration"
    SURVEY = "survey"
    SUPPORT = "support"
    RENAME = "rename"


@dataclass
class FlowOk:
    next_state: UserState
    message: str | None = None
    completed: bool = False
    success: Literal[True] = True


FlowResult = FlowOk | MsgErr


class UserService:
    def __init__(
        self,
        session: AsyncSession,
        bot: Bot,
        action_service: ActionService,
    ) -> None:
        self.session = session
        self.bot = bot
        self.actions = action_service

    async def check_command_allowed(self, user_id: int) -> Ok | MsgErr:
        """
        Check if user can use commands.
        Returns (True, None) if user can proceed, (False, error_msg) otherwise.
        """
        try:
            user = await get_user_expect(self.session, user_id)
        except ExpectationError:
            return MsgErr(error=Messages.not_registered())

        reg_stat = user.reg_stat

        if reg_stat == UserState.DATA_CLEARED:
            return MsgErr(error=Messages.not_registered())

        if reg_stat == UserState.REG_COMPLETED:
            return Ok()

        # All other states block commands
        if reg_stat == UserState.DATA_CLEARED:
            error = Messages.register_for_old()
        elif reg_stat.is_in_registration():
            error = Messages.registration_not_finished()
        elif reg_stat.is_in_support():
            error = Messages.support_call_not_finished()
        elif reg_stat.is_in_survey():
            error = Messages.sociology_not_finished()
        elif reg_stat == UserState.RENAME:
            error = Messages.started_registered()
        else:
            return Ok()

        return MsgErr(error=error)

    async def start_flow(
        self,
        user_id: int,
        flow_type: FlowType,
        state: FSMContext,
    ) -> FlowResult:
        """Start a flow (registration, survey, support, rename)."""
        if flow_type == "registration":
            return await self._start_registration(user_id, state)
        if flow_type == "rename":
            return await self._start_rename(user_id, state)
        if flow_type == "support":
            return await self._start_support(user_id, state)
        if flow_type == "survey":
            return await self._start_survey(user_id, state)
        return MsgErr(error="Unknown flow type")

    async def handle_flow_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle input during a flow based on current FSM state."""
        current_state = await state.get_state()

        for user_state, handler in [
            # Registration flow handlers
            (UserState.REG_NAME, self._handle_name_input),
            (UserState.REG_AGE, self._handle_age_input),
            (UserState.REG_PREFERENCES, self._handle_preferences_input),
            (UserState.REG_LANGUAGE, self._handle_language_input),
            (UserState.REG_AGREEMENT, self._handle_agreement_input),
            # Survey flow handlers
            (UserState.SURVEY_AGE, self._handle_survey_age_input),
            (UserState.SURVEY_LANGUAGE, self._handle_survey_language_input),
            (UserState.SURVEY_PREFERENCES, self._handle_survey_preferences_input),
            (UserState.SURVEY_RATING, self._handle_survey_rating_input),
            (UserState.SURVEY_REGION, self._handle_survey_region_input),
            (UserState.SURVEY_EMAIL, self._handle_survey_email_input),
            (UserState.SURVEY_SEX, self._handle_survey_sex_input),
        ]:
            fsm = user_state.fsm_state()
            if fsm is not None and current_state == fsm.state:
                return await handler(user_id, input_text, state)

        # Support flow handler
        fsm = UserState.SUPPORT.fsm_state()
        if fsm is not None and current_state == fsm.state:
            return await self._handle_support_input(user_id, input_text, state)

        # Rename flow handler
        fsm = UserState.RENAME.fsm_state()
        if fsm is not None and current_state == fsm.state:
            return await self._handle_rename_input(user_id, input_text, state)

        return MsgErr(error="Unknown state")

    # ========== Registration Flow ========== #

    async def _start_registration(
        self,
        user_id: int,
        state: FSMContext,
    ) -> FlowResult:
        """Start registration flow."""
        await state.set_state(UserState.REG_AGREEMENT.fsm_state())
        return FlowOk(
            next_state=UserState.REG_AGREEMENT,
        )

    async def _handle_agreement_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle agreement acceptance."""
        if input_text.lower() not in YES_WORDS:
            return MsgErr(error="Please accept the agreeerror")

        await update_user(
            self.session,
            user_id,
            UserUpdate(reg_stat=UserState.REG_NAME),
        )
        await state.set_state(UserState.REG_NAME.fsm_state())
        return FlowOk(
            message="Agreement accepted",
            next_state=UserState.REG_NAME,
        )

    async def _handle_name_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle name input during registration."""
        name = input_text.strip()

        if len(name) < 3:
            return MsgErr(error="Naerror is too short (min 3 chars)")
        if len(name) > 40:
            return MsgErr(error="Naerror is too long (max 40 chars)")
        if not re.fullmatch(r"^[A-Za-zА-Яа-яЁё\s'-]+$", name):
            return MsgErr(error="Invalid characters in naerror")

        other_users = await count_users_with_name(self.session, name)
        if other_users > 0:
            return MsgErr(error="This name is already taken")

        await update_user(
            self.session,
            user_id,
            UserUpdate(name=name, reg_stat=UserState.REG_AGE),
        )
        await state.set_state(UserState.REG_AGE.fsm_state())
        return FlowOk(
            message=f"Hello, {name}!",
            next_state=UserState.REG_AGE,
        )

    async def _handle_age_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle age input during registration."""
        age_str = input_text.strip()

        if not age_str.isdigit():
            return MsgErr(error="Age error be a number")
        age = int(age_str)
        if age < 14 or age > 99:
            return MsgErr(error="Age error be between 14 and 99")

        await update_user(
            self.session,
            user_id,
            UserUpdate(age=age, reg_stat=UserState.REG_PREFERENCES),
        )
        await state.set_state(UserState.REG_PREFERENCES.fsm_state())
        return FlowOk(
            message="Age accepted",
            next_state=UserState.REG_PREFERENCES,
        )

    async def _handle_preferences_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle publication preferences input."""
        comm = input_text.strip()

        await update_user(
            self.session,
            user_id,
            UserUpdate(comm=comm, reg_stat=UserState.REG_LANGUAGE),
        )
        await state.set_state(UserState.REG_LANGUAGE.fsm_state())
        return FlowOk(
            message="Preferences accepted",
            next_state=UserState.REG_LANGUAGE,
        )

    async def _handle_language_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle language selection input."""
        lang_msg = input_text.strip().replace(" ", "").replace(",", "").replace(".", "")

        if len(lang_msg) > 1 or lang_msg not in ["1", "2", "3"]:
            return MsgErr(error="Please select 1, 2, or 3")

        lang_map: dict[str, UserLanguage] = {"1": "all", "2": "eng", "3": "rus"}
        lang_value = lang_map[lang_msg]

        items = await get_publications_for_language(self.session, lang_value)
        items_str = "|".join([str(item) for item in items])

        if not items:
            await update_user(
                self.session,
                user_id,
                UserUpdate(
                    reg_stat=UserState.REG_COMPLETED,
                    reg_end=datetime.now(),
                ),
            )
            await state.clear()
            return FlowOk(
                next_state=UserState.REG_COMPLETED,
                message="Registration complete! No publications available.",
                completed=True,
            )

        await update_user(
            self.session,
            user_id,
            UserUpdate(
                lng=lang_value,
                items=items_str,
                reg_stat=UserState.REG_COMPLETED,
                reg_end=datetime.now(),
            ),
        )
        await state.clear()
        return FlowOk(
            message="Registration complete!",
            next_state=UserState.REG_COMPLETED,
            completed=True,
        )

    # ========== Other Flows ========== #

    async def _start_rename(
        self,
        user_id: int,
        state: FSMContext,
    ) -> FlowResult:
        """Start rename flow. Requires reg_stat=1."""
        user = await get_user_expect(self.session, user_id)
        if not user.reg_stat.is_registered():
            return MsgErr(error="Must be registered to rename")
        await state.set_state(UserState.RENAME.fsm_state())
        return FlowOk(
            message="Enter new name",
            next_state=UserState.RENAME,
        )

    async def _start_support(
        self,
        user_id: int,
        state: FSMContext,
    ) -> FlowResult:
        """Start support flow. Prevents support during registration (reg_stat 2-6)."""
        user = await get_user_expect(self.session, user_id)
        if user.reg_stat.is_in_registration():
            return MsgErr(error="Cannot start support during registration")
        await update_user(
            self.session,
            user_id,
            UserUpdate(reg_stat=UserState.SUPPORT),
        )
        await state.set_state(UserState.SUPPORT.fsm_state())
        return FlowOk(
            message="Describe your issue",
            next_state=UserState.SUPPORT,
        )

    async def _handle_support_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle support question input."""
        question = input_text.strip()

        if len(question) < 10:
            return MsgErr(error="Question too short (min 10 chars)")
        if len(question) > 256:
            return MsgErr(error="Question too long (max 256 chars)")

        user = await get_user_expect(self.session, user_id)

        await self.bot.send_message(
            chat_id=settings.ADMIN_CHAT_ID,
            text=f"Support question from {user.name} (ID: {user.user_id}): {question}",
        )

        await update_user(
            self.session,
            user_id,
            UserUpdate(reg_stat=UserState.REG_COMPLETED),
        )
        await state.clear()
        return FlowOk(
            message="Support request received",
            next_state=UserState.REG_COMPLETED,
            completed=True,
        )

    async def _handle_rename_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle rename input with validation."""
        new_name = input_text.strip()

        if len(new_name) < 3:
            return MsgErr(error="Name too short (min 3 chars)")
        if len(new_name) > 40:
            return MsgErr(error="Name too long (max 40 chars)")
        if not re.fullmatch(r"^[A-Za-zА-Яа-яЁё\s'-]+$", new_name):
            return MsgErr(error="Invalid characters in name")

        other_users = await count_users_with_name(self.session, new_name)
        if other_users > 0:
            return MsgErr(error="This name is already taken")

        user = await get_user_expect(self.session, user_id)
        old_name = user.name

        await self.actions.log_action(
            user_id=user_id,
            action_type="bot_rename",
            old_value=old_name,
            new_value=new_name,
        )

        await update_user(
            self.session,
            user_id,
            UserUpdate(name=new_name, reg_stat=UserState.REG_COMPLETED),
        )
        await state.clear()
        return FlowOk(
            message=f"Name changed to {new_name}",
            next_state=UserState.REG_COMPLETED,
            completed=True,
        )

    # Survey state mapping
    FIELD_TO_STATE = {
        "age": UserState.SURVEY_AGE,
        "lng": UserState.SURVEY_LANGUAGE,
        "comm": UserState.SURVEY_PREFERENCES,
        "sex": UserState.SURVEY_SEX,
        "rating": UserState.SURVEY_RATING,
        "region": UserState.SURVEY_REGION,
        "email": UserState.SURVEY_EMAIL,
    }

    SURVEY_QUESTIONS = {
        "age": "Please enter your age",
        "lng": "Select your language preference",
        "comm": "Enter your publication preferences",
        "sex": "Enter your gender",
        "rating": "Do you agree to rating?",
        "region": "Enter your region",
        "email": "Enter your email",
    }

    async def _start_survey(
        self,
        user_id: int,
        state: FSMContext,
    ) -> FlowResult:
        """Start survey flow."""
        user = await get_user_expect(self.session, user_id)

        # Check all 7 fields including email and region
        # Order matches state progression: 14→15→16→17→18→19→20
        missing_fields = [
            field
            for field in ["age", "comm", "lng", "rating", "region", "email", "sex"]
            if self._is_field_missing(user, field)
        ]

        if not missing_fields:
            return MsgErr(error="Survey already completed")

        # Store missing fields in FSM context
        await state.update_data(missing_fields=missing_fields)

        # Set first state (14 = SURVEY_AGE)
        first_field = missing_fields[0]
        first_state = self.FIELD_TO_STATE[first_field]
        await state.set_state(first_state.fsm_state())

        return FlowOk(
            message=self.SURVEY_QUESTIONS[first_field],
            next_state=first_state,
        )

    def _is_field_missing(self, user: User, field: str) -> bool:
        """Check if a field is missing from user profile."""
        value = getattr(user, field, None)
        if value is None:
            return True
        return field in ("comm", "email", "region") and value == ""

    async def _survey_progress(
        self,
        user_id: int,
        field: str,
        state: FSMContext,
    ) -> FlowResult:
        """Progress to next survey state or complete."""
        # Get remaining missing fields
        data = await state.get_data()
        missing_fields: list[str] = data.get("missing_fields", [])

        # Remove current field
        if field in missing_fields:
            missing_fields.remove(field)

        # Check if more fields
        if missing_fields:
            # Update FSM context with remaining fields
            await state.update_data(missing_fields=missing_fields)

            # Set next state
            next_field = missing_fields[0]
            next_state = self.FIELD_TO_STATE[next_field]
            await state.set_state(next_state.fsm_state())

            return FlowOk(
                message=self.SURVEY_QUESTIONS[next_field],
                next_state=next_state,
            )

        # Survey complete
        await state.clear()
        await self._set_registered(user_id)
        return FlowOk(
            message="Survey completed!",
            next_state=UserState.REG_COMPLETED,
            completed=True,
        )

    async def _handle_survey_age_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle age input during survey."""
        age_str = input_text.strip()

        if not age_str.isdigit():
            return MsgErr(error="Age must be a number")
        age = int(age_str)
        if age < 14 or age > 99:
            return MsgErr(error="Age must be between 14 and 99")

        await update_user(self.session, user_id, UserUpdate(age=age))
        return await self._survey_progress(user_id, "age", state)

    async def _handle_survey_language_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle language selection during survey."""
        lang_msg = input_text.strip().replace(" ", "").replace(",", "").replace(".", "")

        if len(lang_msg) > 1 or lang_msg not in ["1", "2", "3"]:
            return MsgErr(error="Please select 1, 2, or 3")

        lang_map: dict[str, UserLanguage] = {"1": "all", "2": "eng", "3": "rus"}
        lang_value = lang_map[lang_msg]

        await update_user(self.session, user_id, UserUpdate(lng=lang_value))
        return await self._survey_progress(user_id, "lng", state)

    async def _handle_survey_preferences_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle publication preferences during survey."""
        comm = input_text.strip()
        await update_user(self.session, user_id, UserUpdate(comm=comm))
        return await self._survey_progress(user_id, "comm", state)

    async def _handle_survey_rating_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle rating agreement during survey."""
        answer = input_text.lower()

        if answer in YES_WORDS:
            rating_value = 1
        elif answer in NO_WORDS:
            rating_value = 0
        else:
            return MsgErr(error="Please answer yes or no")

        await update_user(self.session, user_id, UserUpdate(rating=rating_value))
        return await self._survey_progress(user_id, "rating", state)

    async def _handle_survey_region_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle region input during survey."""
        region_msg = input_text.strip()

        if len(region_msg) < 3:
            return MsgErr(error="Region name too short (min 3 chars)")

        await update_user(self.session, user_id, UserUpdate(region=region_msg))
        return await self._survey_progress(user_id, "region", state)

    async def _handle_survey_email_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle email input during survey."""
        email_msg = input_text.strip().lower()

        if "@" not in email_msg or "." not in email_msg:
            return MsgErr(error="Invalid email address")

        await update_user(self.session, user_id, UserUpdate(email=email_msg))
        return await self._survey_progress(user_id, "email", state)

    async def _handle_survey_sex_input(
        self,
        user_id: int,
        input_text: str,
        state: FSMContext,
    ) -> FlowResult:
        """Handle gender input during survey."""
        gender_msg = input_text.lower()

        if "жен" in gender_msg or "female" in gender_msg:
            gender_value = "ff"
        elif "муж" in gender_msg or "male" in gender_msg:
            gender_value = "mm"
        else:
            return MsgErr(error="Please specify male or female")

        await update_user(self.session, user_id, UserUpdate(sex=gender_value))
        return await self._survey_progress(user_id, "sex", state)

    async def _set_registered(self, user_id: int) -> None:
        """Set user as registered (reg_stat=1)."""
        await update_user(
            self.session,
            user_id,
            UserUpdate(reg_stat=UserState.REG_COMPLETED),
        )
