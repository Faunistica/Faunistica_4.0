from dataclasses import dataclass


@dataclass
class PublData:
    author: str | None
    year: str | None
    name: str | None
    pdf_file: str | None


@dataclass
class Location:
    region: str
    districts: list[str]
