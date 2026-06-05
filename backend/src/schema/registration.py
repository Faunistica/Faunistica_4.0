from pydantic import BaseModel, Field

from core.enums import PendingStatus
from schema.user import UserLanguage


class FormRequest(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9_]+$")
    password: str = Field(min_length=8, max_length=128)
    name: str
    age: int
    lng: UserLanguage
    comm: str


class RegistrationStartResponse(BaseModel):
    code: str
    code_expires_in: int
    token: str | None = None
    token_expires_in: int | None = None


class RegistrationStatusResponse(BaseModel):
    status: PendingStatus
