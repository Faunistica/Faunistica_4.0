import re
from datetime import datetime
from typing import get_args

from bot.messages import Messages
from core.config import settings
from core.enums import UserLanguage
from core.exceptions import MsgErr, Ok
from core.model import User

_NAME_REGEX = re.compile(r"^[а-яА-ЯёЁa-zA-Z0-9\_]+$")
_EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

_LANG_MAP: dict[str, UserLanguage] = {"1": "all", "2": "eng", "3": "rus"}


class UserValidators:
    @staticmethod
    def validate_name(name: str) -> Ok | MsgErr:
        if len(name) < 3:
            return MsgErr(error=Messages.message_too_short())
        if len(name) > 40:
            return MsgErr(error=Messages.message_too_long())
        if not _NAME_REGEX.fullmatch(name):
            return MsgErr(error=Messages.invalid_characters())
        return Ok()

    @staticmethod
    def validate_sex(sex: str) -> Ok | MsgErr:
        if sex not in ["F", "M", "N"]:
            return MsgErr(error=Messages.invalid_sex())
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
    def validate_language(lang: UserLanguage) -> Ok | MsgErr:
        if lang not in get_args(UserLanguage):
            return MsgErr(error=Messages.invalid_lang())
        return Ok()

    @staticmethod
    def validate_email(email: str) -> Ok | MsgErr:
        if len(email) < 5:
            return MsgErr(error=Messages.message_too_short())
        if len(email) > 100:
            return MsgErr(error=Messages.message_too_long())
        if not _EMAIL_REGEX.fullmatch(email):
            return MsgErr(error=Messages.not_email())
        return Ok()

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
