from pydantic import BaseModel


class GeoSearchRequest(BaseModel):
    field: str
    text: str
    filters: dict[str, str | None] | None = None


class GeoSearchResponse(BaseModel):
    suggestions: list[str] | None = None


class GetLocationRequest(BaseModel):
    degrees_n: float
    minutes_n: float | None = None
    seconds_n: float | None = None
    degrees_e: float
    minutes_e: float | None = None
    seconds_e: float | None = None


class GetLocationResponse(BaseModel):
    country: str | None = None
    region: str | None = None
    district: str | None = None


class Location(BaseModel):
    country: str
    region: str
    district: str
