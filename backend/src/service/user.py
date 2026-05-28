import logging
import re
from datetime import datetime
from typing import Annotated, Any

from aiogram import Bot
from fastapi import Depends

from bot.generate_pass import generate_secure_password
from bot.messages import Messages
from core.config import settings
from core.dependencies import DBSession
from core.enums import UserState
from core.exceptions import MsgErr, Ok
from core.model import User
from core.security import get_password_hash
from repository.user import (
    count_users_with_name,
    create_user_or_update,
    find_user_by_username,
    get_user,
    get_user_expect,
    increment_token_version,
    update_user,
)
from schema.user import UserLanguage, UserUpdate
from service.actions import ActionService

logger = logging.getLogger(__name__)

_NAME_REGEX = re.compile(r"^[а-яА-ЯёЁa-zA-Z0-9\s\-'.]+$")

_LANG_MAP: dict[str, UserLanguage] = {"1": "all", "2": "eng", "3": "rus"}


REGISTERED_STATES = (
    UserState.REG_COMPLETED,
    UserState.SUPPORT,
    UserState.SURVEY_AGE,
    UserState.SURVEY_PREFERENCES,
    UserState.SURVEY_LANGUAGE,
    UserState.SURVEY_RATING,
    UserState.SURVEY_REGION,
    UserState.SURVEY_EMAIL,
    UserState.SURVEY_SEX,
    UserState.RENAME,
)


class UserService:
    def __init__(
        self,
        session: DBSession,
        bot: Bot | None = None,
        action_service: Annotated[ActionService, Depends()] | None = None,
    ) -> None:
        self.session = session
        self.bot = bot
        self.actions = action_service

    async def check_commands_allowed(
        self, *, user_id: int | None = None, user: User | None = None
    ) -> Ok | MsgErr:
        if user is None:
            if user_id is None:
                raise ValueError("both user and user_id are None")

            user = await get_user(self.session, user_id)
            if user is None:
                return MsgErr(error=Messages.not_registered())

        reg_stat = user.reg_stat

        if reg_stat == UserState.DATA_CLEARED:
            if self.actions:
                await self.actions.log_bot_other(user.user_id, "not_reg_end")
            return MsgErr(error=Messages.register_for_old())
        if reg_stat.is_in_registration():
            if self.actions:
                await self.actions.log_bot_other(user.user_id, "not_reg_end")
            return MsgErr(error=Messages.registration_not_finished())
        if reg_stat.is_in_support():
            return MsgErr(error=Messages.support_flow_not_finished())
        if reg_stat.is_in_survey():
            return MsgErr(error=Messages.sociology_flow_not_finished())
        if reg_stat == UserState.RENAME:
            return MsgErr(error=Messages.rename_flow_not_finished())
        return Ok()

    # ========== Queries ==========

    async def get(self, user_id: int) -> User | None:
        return await get_user(self.session, user_id)

    async def get_expect(self, user_id: int) -> User:
        return await get_user_expect(self.session, user_id)

    async def find_by_username(self, username: str) -> User | None:
        return await find_user_by_username(self.session, username)

    # ========== Validation ==========

    async def validate_name(
        self, name: str, *, exclude_user_id: int | None = None
    ) -> Ok | MsgErr:
        if len(name) < 3:
            return MsgErr(error=Messages.message_too_short())
        if len(name) > 40:
            return MsgErr(error=Messages.message_too_long())
        if not _NAME_REGEX.fullmatch(name):
            return MsgErr(error=Messages.invalid_characters())

        other = await count_users_with_name(self.session, name)
        if other > 0:
            if exclude_user_id is not None:
                user = await get_user(self.session, exclude_user_id)
                if user and user.name == name:
                    return Ok()
            return MsgErr(error=Messages.name_already_exists())

        return Ok()

    @staticmethod
    def validate_age_str(age_str: str) -> Ok | MsgErr:
        if len(age_str) > 5:
            return MsgErr(error=Messages.message_too_long())
        if not age_str.isdigit():
            return MsgErr(error=Messages.message_no_digits())
        age = int(age_str)
        if age > 99:
            return MsgErr(error=Messages.age_too_high())
        if age < 14:
            return MsgErr(error=Messages.age_too_low())
        return Ok()

    @staticmethod
    def parse_language(lang: str) -> UserLanguage | MsgErr:
        cleaned = lang.strip().replace(" ", "").replace(",", "").replace(".", "")
        if len(cleaned) > 1 or cleaned not in _LANG_MAP:
            return MsgErr(error=Messages.selection_not_recognized())
        return _LANG_MAP[cleaned]

    @staticmethod
    def get_missing_survey_fields(user: User) -> list[str]:
        fields = ["age", "comm", "lng", "rating", "region", "email", "sex"]
        missing = []
        for field in fields:
            value = getattr(user, field, None)
            if value is None or (field in ("comm", "email", "region") and value == ""):
                missing.append(field)
        return missing

    @staticmethod
    def is_password_expired(user: User) -> bool:
        if user.hash_date is None:
            return False
        minutes = (datetime.now() - user.hash_date).total_seconds() / 60
        return minutes > settings.PASSWORD_EXPIRE_MINUTES

    # ========== Mutations ==========

    async def _update(self, user_id: int, **kw: Any) -> User | None:  # noqa: ANN401
        return await update_user(self.session, user_id, UserUpdate(**kw))

    async def start_registration(self, user_id: int) -> None:
        await create_user_or_update(self.session, user_id, UserState.REG_AGREEMENT)

    async def accept_agreement(self, user_id: int) -> None:
        await self._update(user_id, reg_stat=UserState.REG_NAME)

    async def set_name(self, user_id: int, name: str) -> Ok | MsgErr:
        result = await self.validate_name(name)
        if isinstance(result, MsgErr):
            return result
        await self._update(user_id, name=name, reg_stat=UserState.REG_AGE)
        return Ok()

    async def set_age(self, user_id: int, age_str: str) -> Ok | MsgErr:
        result = self.validate_age_str(age_str)
        if isinstance(result, MsgErr):
            return result
        await self._update(
            user_id, age=int(age_str), reg_stat=UserState.REG_PREFERENCES
        )
        return Ok()

    async def set_preferences(self, user_id: int, comm: str) -> None:
        await self._update(user_id, comm=comm, reg_stat=UserState.REG_LANGUAGE)

    async def set_language_and_complete(self, user_id: int, lang: str) -> Ok | MsgErr:
        parsed = self.parse_language(lang)
        if isinstance(parsed, MsgErr):
            return parsed
        await self._update(
            user_id,
            lng=parsed,
            reg_stat=UserState.REG_COMPLETED,
            reg_end=datetime.now(),
        )
        return Ok()

    async def rename_user(self, user_id: int, new_name: str) -> Ok | MsgErr:
        user = await self.get_expect(user_id)
        if new_name == user.name:
            return MsgErr(error=Messages.same_name(new_name))

        result = await self.validate_name(new_name, exclude_user_id=user_id)
        if isinstance(result, MsgErr):
            return result

        if self.actions:
            await self.actions.log_bot_rename(
                user_id=user_id, old=user.name, new=new_name
            )
        await self._update(user_id, name=new_name, reg_stat=UserState.REG_COMPLETED)
        return Ok()

    async def generate_password(self, user_id: int) -> str:
        password = generate_secure_password()
        hashed = get_password_hash(password)
        await self._update(user_id, hash=hashed, hash_date=datetime.now())
        return password

    async def cancel_action(self, user: User) -> Ok | MsgErr:
        if user.reg_stat == UserState.DATA_CLEARED:
            return MsgErr(error=Messages.register_for_old())
        if user.reg_stat.is_in_registration():
            return MsgErr(
                error=Messages.unavailable_during_registration(),
            )
        await self._update(user.user_id, reg_stat=UserState.REG_COMPLETED)
        return Ok()

    async def update_user_data(self, user_id: int, **kw: object) -> User | None:
        return await self._update(user_id, **kw)

    async def set_state(self, user_id: int, state: UserState) -> None:
        await self._update(user_id, reg_stat=state)

    async def reset_to_completed(self, user_id: int) -> None:
        await self._update(user_id, reg_stat=UserState.REG_COMPLETED)

    async def increment_token_version(self, user_id: int) -> int:
        return await increment_token_version(self.session, user_id)
