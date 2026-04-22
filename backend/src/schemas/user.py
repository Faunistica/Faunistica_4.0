from datetime import datetime

from pydantic import BaseModel

from schemas.common import UNSET, Unset


class UserMinimal(BaseModel):
    user_id: int
    username: str


class UpdateUser(BaseModel):
    publ_id: int | None | Unset = UNSET
    tlg_name: str | None | Unset = UNSET
    tlg_username: str | None | Unset = UNSET
    name: str | Unset = UNSET
    reg_stat: int | None | Unset = UNSET
    hash: str | None | Unset = UNSET
    hash_date: datetime | None | Unset = UNSET
    items: str | Unset = UNSET
    age: int | None | Unset = UNSET
    lng: str | None | Unset = UNSET
    comm: str | None | Unset = UNSET
    reg_run: datetime | None | Unset = UNSET
    reg_end: datetime | None | Unset = UNSET
    sex: str | None | Unset = UNSET
    rating: int | None | Unset = UNSET
    email: str | None | Unset = UNSET
    region: str | None | Unset = UNSET
