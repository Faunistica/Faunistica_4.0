from dataclasses import dataclass


@dataclass
class PublData:
    author: str | None
    year: str | None
    name: str | None
    pdf_file: str | None


@dataclass
class LocationList:
    region: str
    districts: list[str]


@dataclass
class Location:
    country: str
    region: str
    district: str


@dataclass
class EventDate:
    yy: int | None
    mm: int | None
    dd: int | None
    yy_end: int | None
    mm_end: int | None
    dd_end: int | None
