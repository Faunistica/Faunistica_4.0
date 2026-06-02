from datetime import datetime

from pydantic import BaseModel, Field

from core.enums import PendingStatus


class RegistrationStartRequest(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9_]+$")
    password: str = Field(min_length=8, max_length=128)


class RegistrationStartResponse(BaseModel):
    code: str
    expires_in: int


class RegistrationStatusResponse(BaseModel):
    status: PendingStatus
    username: str | None = None
    user_id: int | None = None
    confirmed_at: datetime | None = None
