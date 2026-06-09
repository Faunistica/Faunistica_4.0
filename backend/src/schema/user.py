from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from core.enums import UserLanguage, UserState
from core.exceptions import MsgErr
from schema.common import UNSET, Unset
from service.user_validation import UserValidators


class UserMinimal(BaseModel):
    user_id: int
    name: str


class UserFull(UserMinimal):
    tlg_name: str | None = None
    tlg_username: str | None = None
    reg_stat: UserState | None = None
    username: str | None = None
    items: str
    age: int | None = None
    lng: UserLanguage | None = None
    comm: str | None = None
    reg_run: datetime | None = None
    reg_end: datetime | None = None
    sex: str | None = None
    rating: int | None = None
    email: str | None = None
    region: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UserUpdateMe(BaseModel):
    username: str | None = Field(
        None, min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9_]+$"
    )
    password: str | None = Field(None, min_length=8, max_length=128)
    name: str | None = None
    age: int | None = None
    lng: UserLanguage | None = None
    comm: str | None = None
    sex: str | None = None
    rating: int | None = None
    email: str | None = None
    region: str | None = Field(None, max_length=255)

    @field_validator("name")
    @classmethod
    def validate_name_field(cls, name: str | None) -> str | None:
        if name is None:
            return None
        result = UserValidators.validate_name(name)
        if isinstance(result, MsgErr):
            raise ValueError(result.error)
        return name

    @field_validator("sex")
    @classmethod
    def validate_sex_field(cls, sex: str | None) -> str | None:
        if sex is None:
            return None
        result = UserValidators.validate_sex(sex)
        if isinstance(result, MsgErr):
            raise ValueError(result.error)
        return sex

    @field_validator("age")
    @classmethod
    def validate_age_field(cls, age: int | None) -> int | None:
        if age is None:
            return None
        result = UserValidators.validate_age_str(str(age))
        if isinstance(result, MsgErr):
            raise ValueError(result.error)
        return age

    @field_validator("email")
    @classmethod
    def validate_email_field(cls, email: str | None) -> str | None:
        if email is None:
            return None
        result = UserValidators.validate_email(email)
        if isinstance(result, MsgErr):
            raise ValueError(result.error)
        return email

    model_config = ConfigDict(populate_by_name=True)


class UserLookupResponse(BaseModel):
    user_id: int
    username: str | None = Field(
        None, min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9_]+$"
    )


class UserUpdate(BaseModel):
    tlg_name: str | None | Unset = UNSET
    tlg_username: str | None | Unset = UNSET
    username: str | None | Unset = UNSET
    name: str | None | Unset = UNSET
    reg_stat: UserState | None | Unset = UNSET
    hash: str | None | Unset = UNSET
    hash_date: datetime | None | Unset = UNSET
    items: str | Unset = UNSET
    age: int | None | Unset = UNSET
    lng: UserLanguage | None | Unset = UNSET
    comm: str | None | Unset = UNSET
    reg_run: datetime | None | Unset = UNSET
    reg_end: datetime | None | Unset = UNSET
    sex: str | None | Unset = UNSET
    rating: int | None | Unset = UNSET
    email: str | None | Unset = UNSET
    region: str | None | Unset = UNSET
