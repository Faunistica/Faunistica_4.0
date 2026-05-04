import logging
import re
from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from aiogram import Bot
from aiogram.fsm.context import FSMContext
from asyncpg.compat import StrEnum
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from bot.messages import Messages
from core.enums import UserState
from core.exceptions import ExpectationError, MsgErr, Ok
from core.model import User
from repository.publication import get_publication_expect, get_publications_for_language
from repository.user import count_users_with_name, get_user_expect, update_user
from schema.common import Publication
from schema.user import UserLanguage, UserUpdate
from service.actions import ActionService

YES_WORDS = ["yes", "да", "принимаю", "ага", "соглашаюсь", "принять", "agree"]

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

        if current_state == UserState.REG_NAME.fsm_state().state:
            return await self._handle_name_input(user_id, input_text, state)
        if current_state == UserState.REG_AGE.fsm_state().state:
            return await self._handle_age_input(user_id, input_text, state)
        if current_state == UserState.REG_PREFERENCES.fsm_state().state:
            return await self._handle_preferences_input(user_id, input_text, state)
        if current_state == UserState.REG_LANGUAGE.fsm_state().state:
            return await self._handle_language_input(user_id, input_text, state)
        if current_state == UserState.REG_AGREEMENT.fsm_state().state:
            return await self._handle_agreement_input(user_id, input_text, state)
        return MsgErr(error="Unknown state")

    async def assign_publication(
        self,
        user_id: int,
    ) -> Publication | None:
        """Assign publication to user if they don't have one."""
        user = await get_user_expect(self.session, user_id)

        if user.publ_id is not None:
            publ = await get_publication_expect(self.session, user.publ_id)
            return Publication.model_validate(publ)

        queue = user.items.split("|") if user.items else []
        if not queue:
            return None

        next_publ_id = int(queue[0])

        stmt = update(User).where(User.user_id == user_id).values(publ_id=next_publ_id)
        await self.session.execute(stmt)
        await self.session.commit()

        publ = await get_publication_expect(self.session, next_publ_id)
        return Publication.model_validate(publ)

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
        """Start rename flow."""
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
        """Start support flow."""
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

    async def _start_survey(
        self,
        user_id: int,
        state: FSMContext,
    ) -> FlowResult:
        """Start survey flow."""
        user = await get_user_expect(self.session, user_id)

        missing_fields = [
            field
            for field in ["age", "lng", "comm", "sex", "rating"]
            if getattr(user, field) is None
        ]

        if not missing_fields:
            return MsgErr(error="Survey already coerror")

        next_question = missing_fields[0]
        if next_question == "age":
            await state.set_state(UserState.SURVEY_AGE.fsm_state())
            return FlowOk(
                message="Please enter your age",
                next_state=UserState.SURVEY_AGE,
            )

        return MsgErr(error="Survey question not implemented")
