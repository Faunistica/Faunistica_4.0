from enum import Enum

from pydantic import BaseModel


class Unset(Enum):
    TOKEN = 0


UNSET = Unset.TOKEN


class LoginRequest(BaseModel):
    username: str
    password: str


class Message(BaseModel):
    message: str


class Publication(BaseModel):
    author: str | None = None
    year: str | None = None
    name: str | None = None
    pdf_file: str | None = None


class SupportRequest(BaseModel):
    link: str
    user_name: str
    text: str
    issue_type: str


class EventDate(BaseModel):
    yy: int | None = None
    mm: int | None = None
    dd: int | None = None
    yy_end: int | None = None
    mm_end: int | None = None
    dd_end: int | None = None
