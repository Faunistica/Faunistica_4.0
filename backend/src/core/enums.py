import logging
from enum import IntEnum

from aiogram.fsm.state import State
from sqlalchemy import Integer, TypeDecorator
from sqlalchemy.engine import Dialect

from bot.states import (
    RegistrationStates,
    RenameStates,
    SociologyStates,
    SupportStates,
)

logger = logging.getLogger(__name__)


class UserStateType(TypeDecorator):
    impl = Integer
    cache_ok = True

    def process_bind_param(
        self,
        value: "UserState | int | None",
        dialect: Dialect,
    ) -> int:
        if value is None:
            return UserState.DATA_CLEARED
        return int(value)

    def process_result_value(
        self,
        value: int | None,
        dialect: Dialect,
    ) -> "UserState | None":
        if value is None:
            return UserState.DATA_CLEARED
        return UserState(value)


class UserState(IntEnum):
    DATA_CLEARED = 0
    REG_COMPLETED = 1
    REG_AGREEMENT = 2
    REG_NAME = 3
    REG_AGE = 4
    REG_PREFERENCES = 5
    REG_LANGUAGE = 6
    SUPPORT = 7
    SURVEY_AGE = 14
    SURVEY_PREFERENCES = 15
    SURVEY_LANGUAGE = 16
    SURVEY_RATING = 17
    SURVEY_REGION = 18
    SURVEY_EMAIL = 19
    SURVEY_SEX = 20
    RENAME = 22

    def is_registered(self) -> bool:
        return self == UserState.REG_COMPLETED

    def is_in_registration(self) -> bool:
        return self in (
            UserState.REG_AGREEMENT,
            UserState.REG_NAME,
            UserState.REG_AGE,
            UserState.REG_PREFERENCES,
            UserState.REG_LANGUAGE,
        )

    def is_in_survey(self) -> bool:
        return self in (
            UserState.SURVEY_AGE,
            UserState.SURVEY_PREFERENCES,
            UserState.SURVEY_LANGUAGE,
            UserState.SURVEY_RATING,
            UserState.SURVEY_REGION,
            UserState.SURVEY_EMAIL,
            UserState.SURVEY_SEX,
        )

    def is_in_support(self) -> bool:
        return self == UserState.SUPPORT

    def fsm_state(self) -> State | None:
        mapping = {
            UserState.REG_AGREEMENT: RegistrationStates.waiting_for_agreement,
            UserState.REG_NAME: RegistrationStates.waiting_for_name,
            UserState.REG_AGE: RegistrationStates.waiting_for_age,
            UserState.REG_PREFERENCES: RegistrationStates.waiting_for_preferences,
            UserState.REG_LANGUAGE: RegistrationStates.waiting_for_language,
            UserState.SUPPORT: SupportStates.waiting_for_question,
            UserState.RENAME: RenameStates.waiting_for_new_name,
            UserState.SURVEY_AGE: SociologyStates.waiting_for_age,
            UserState.SURVEY_PREFERENCES: SociologyStates.waiting_for_comments,
            UserState.SURVEY_LANGUAGE: SociologyStates.waiting_for_language,
            UserState.SURVEY_RATING: SociologyStates.waiting_for_rating_agreement,
            UserState.SURVEY_REGION: SociologyStates.waiting_for_region,
            UserState.SURVEY_EMAIL: SociologyStates.waiting_for_email,
            UserState.SURVEY_SEX: SociologyStates.waiting_for_gender,
        }

        return mapping.get(self)
