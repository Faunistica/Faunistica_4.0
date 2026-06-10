from datetime import datetime
from enum import Enum, StrEnum
from typing import TypedDict

from pydantic import BaseModel, ConfigDict, Field, model_validator

from core.config import settings


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
    name: str
    username: str


class Publication(BaseModel):
    publ_id: int
    type: str | None = None
    author: str | None = None
    year: int | None = None
    name: str | None = None

    external: str | None = None
    language: str | None = None

    pdf_file: str | None = None
    bib_file: str | None = None
    arj_file: str | None = None

    resume: str | None = None
    ural: int | None = None
    # TODO: change type to bool in migration
    coords: int | None = None
    cover: int | None = None
    occs: int | None = None
    spec: int | None = None
    e_author: str | None = None
    e_name: str | None = None
    interactable: bool = True

    @model_validator(mode="after")
    def _prepend_file_url_prefix(self) -> "Publication":
        prefix = settings.PUBLICATION_FILES_BASE_URL
        if not prefix:
            return self
        prefix = prefix.rstrip("/") + "/"
        for field in ("pdf_file", "bib_file", "arj_file"):
            value = getattr(self, field, None)
            if value and not value.startswith(("http://", "https://", "/")):
                setattr(self, field, prefix + value)
        return self

    model_config = ConfigDict(from_attributes=True)


class SupportRequest(BaseModel):
    link: str
    username: str
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


class ProjectStats(TypedDict):
    total_volunteers: int
    total_records: int
    species_count: int
    processed_publications_count: int
    most_common_family: str | None
    most_common_genus: str | None
    most_common_species: str | None


class UserStats(TypedDict):
    records_entered: int
    publications_processed: int
    most_common_family: str | None
    most_common_genus: str | None
    most_common_species: str | None


class ProcessingLevel(StrEnum):
    FULL = "full"
    URAL = "ural"
    PART = "part"
    SKIP = "skip"
