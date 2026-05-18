from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from core.enums import UserState
from schema.common import UNSET, Unset

type UserLanguage = Literal["eng", "rus", "all"]


class UserMinimal(BaseModel):
    user_id: int
    name: str


class UserFull(UserMinimal):
    tlg_name: str | None = None
    tlg_username: str | None = None
    reg_stat: UserState | None = None
    hash: str | None = None
    hash_date: datetime | None = None
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
    lng: UserLanguage | None = None
    email: str | None = None


class UserLookupResponse(BaseModel):
    user_id: int
    name: str | None


class UserUpdate(BaseModel):
    tlg_name: str | None | Unset = UNSET
    tlg_username: str | None | Unset = UNSET
    name: str | Unset = UNSET
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
