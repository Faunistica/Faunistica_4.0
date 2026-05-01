from datetime import datetime
from enum import Enum, StrEnum

from pydantic import BaseModel, ConfigDict, Field


class PaginatedResponse[T](BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


class Unset(Enum):
    TOKEN = 0


UNSET = Unset.TOKEN


class LoginRequest(BaseModel):
    username: str
    password: str


class Message(BaseModel):
    message: str


class UserInfo(BaseModel):
    user_id: int
    username: str


class UserLoginResponse(BaseModel):
    user_id: int
    username: str


class Publication(BaseModel):
    id: int
    author: str | None = None
    year: int | None = None
    name: str | None = None
    pdf_file: str | None = None

    model_config = ConfigDict(from_attributes=True)


class SupportRequest(BaseModel):
    link: str
    user_name: str
    text: str = Field(min_length=10)
    issue_type: str


class EventDate(BaseModel):
    yy: int | None = None
    mm: int | None = None
    dd: int | None = None
    yy_end: int | None = None
    mm_end: int | None = None
    dd_end: int | None = None


class WinnerInfo(BaseModel):
    picfile: str
    message: str
    datetime: datetime


class MilestoneInfo(BaseModel):
    milestone: int
    user_id: int
    datetime: datetime


class ProcessingLevel(StrEnum):
    FULL = "full"
    URAL = "ural"
    PART = "part"
    SKIP = "skip"
