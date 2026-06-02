from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class RegistrationStartRequest(BaseModel):
    username: str = Field(min_length=3, max_length=40)
    password: str = Field(min_length=8, max_length=128)


class RegistrationStartResponse(BaseModel):
    code: str
    expires_in: int


class RegistrationStatusResponse(BaseModel):
    status: Literal["pending", "confirmed", "expired"]
    username: str | None = None
    user_id: int | None = None
    confirmed_at: datetime | None = None
