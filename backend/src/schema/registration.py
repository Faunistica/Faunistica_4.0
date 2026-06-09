from pydantic import BaseModel, Field, field_validator

from core.enums import PendingStatus, UserLanguage
from core.exceptions import MsgErr
from service.user_validation import UserValidators


class SurveyRequest(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9_]+$")
    password: str = Field(min_length=8, max_length=128)
    name: str
    sex: str
    age: int
    lng: UserLanguage
    comm: str = Field(max_length=255)
    code: str = Field(min_length=4, max_length=20)
    token: str = Field(min_length=20, max_length=50)

    @field_validator("name")
    @classmethod
    def validate_name_field(cls, name: str) -> str:
        result = UserValidators.validate_name(name)
        if isinstance(result, MsgErr):
            raise ValueError(result.error)
        return name

    @field_validator("sex")
    @classmethod
    def validate_sex_field(cls, sex: str) -> str:
        result = UserValidators.validate_sex(sex)
        if isinstance(result, MsgErr):
            raise ValueError(result.error)
        return sex

    @field_validator("age")
    @classmethod
    def validate_age_field(cls, age: int) -> int:
        result = UserValidators.validate_age_str(str(age))
        if isinstance(result, MsgErr):
            raise ValueError(result.error)
        return age


class RegistrationStartResponse(BaseModel):
    code: str
    code_expires_in: int | None = None
    token: str | None = None
    token_expires_in: int | None = None
    bot_url: str | None = None


class RegistrationStatusResponse(BaseModel):
    status: PendingStatus
    user_id: int | None = None
    name: str | None = None
    username: str | None = None
