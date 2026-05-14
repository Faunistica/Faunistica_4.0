from bot.states import (
    RegistrationStates,
    RenameStates,
    SociologyStates,
    SupportStates,
)
from core.enums import UserState


class TestUserStateEnum:
    def test_enum_values(self):
        assert UserState.DATA_CLEARED == 0
        assert UserState.REG_COMPLETED == 1
        assert UserState.REG_AGREEMENT == 2
        assert UserState.REG_NAME == 3
        assert UserState.REG_AGE == 4
        assert UserState.REG_PREFERENCES == 5
        assert UserState.REG_LANGUAGE == 6
        assert UserState.SUPPORT == 7
        assert UserState.SURVEY_AGE == 14
        assert UserState.SURVEY_PREFERENCES == 15
        assert UserState.SURVEY_LANGUAGE == 16
        assert UserState.SURVEY_RATING == 17
        assert UserState.SURVEY_REGION == 18
        assert UserState.SURVEY_EMAIL == 19
        assert UserState.SURVEY_SEX == 20
        assert UserState.RENAME == 22

    def test_is_registered(self):
        assert UserState.REG_COMPLETED.is_registered() is True
        assert UserState.DATA_CLEARED.is_registered() is False
        assert UserState.REG_AGREEMENT.is_registered() is False

    def test_is_in_registration(self):
        for state in [
            UserState.REG_AGREEMENT,
            UserState.REG_NAME,
            UserState.REG_AGE,
            UserState.REG_PREFERENCES,
            UserState.REG_LANGUAGE,
        ]:
            assert state.is_in_registration() is True

        assert UserState.REG_COMPLETED.is_in_registration() is False
        assert UserState.SUPPORT.is_in_registration() is False
        assert UserState.SURVEY_AGE.is_in_registration() is False

    def test_is_in_survey(self):
        for state in [
            UserState.SURVEY_AGE,
            UserState.SURVEY_PREFERENCES,
            UserState.SURVEY_LANGUAGE,
            UserState.SURVEY_RATING,
            UserState.SURVEY_REGION,
            UserState.SURVEY_EMAIL,
            UserState.SURVEY_SEX,
        ]:
            assert state.is_in_survey() is True

        assert UserState.REG_COMPLETED.is_in_survey() is False
        assert UserState.SUPPORT.is_in_survey() is False

    def test_is_in_support(self):
        assert UserState.SUPPORT.is_in_support() is True
        assert UserState.REG_COMPLETED.is_in_support() is False
        assert UserState.REG_AGREEMENT.is_in_support() is False

    def test_fsm_state_mapping(self):
        assert (
            UserState.REG_AGREEMENT.fsm_state()
            == RegistrationStates.waiting_for_agreement
        )
        assert UserState.REG_NAME.fsm_state() == RegistrationStates.waiting_for_name
        assert UserState.REG_AGE.fsm_state() == RegistrationStates.waiting_for_age
        assert (
            UserState.REG_PREFERENCES.fsm_state()
            == RegistrationStates.waiting_for_preferences
        )
        assert (
            UserState.REG_LANGUAGE.fsm_state()
            == RegistrationStates.waiting_for_language
        )
        assert UserState.SUPPORT.fsm_state() == SupportStates.waiting_for_question
        assert UserState.RENAME.fsm_state() == RenameStates.waiting_for_new_name
        assert UserState.SURVEY_AGE.fsm_state() == SociologyStates.waiting_for_age
        assert (
            UserState.SURVEY_LANGUAGE.fsm_state()
            == SociologyStates.waiting_for_language
        )
        assert (
            UserState.SURVEY_RATING.fsm_state()
            == SociologyStates.waiting_for_rating_agreement
        )
        assert UserState.SURVEY_REGION.fsm_state() == SociologyStates.waiting_for_region
        assert UserState.SURVEY_EMAIL.fsm_state() == SociologyStates.waiting_for_email
        assert UserState.SURVEY_SEX.fsm_state() == SociologyStates.waiting_for_gender

    def test_fsm_state_returns_none_for_non_state(self):
        assert UserState.REG_COMPLETED.fsm_state() is None
        assert UserState.DATA_CLEARED.fsm_state() is None

    def test_int_enum_serialization(self):
        assert int(UserState.REG_COMPLETED) == 1
        assert UserState(1) == UserState.REG_COMPLETED
        assert UserState(0) == UserState.DATA_CLEARED
