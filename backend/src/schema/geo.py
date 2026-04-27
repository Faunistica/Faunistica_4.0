from typing import Literal

from pydantic import BaseModel


class GeoFilters(BaseModel):
    region: str | None = None


class GeoSearchRequest(BaseModel):
    field: str
    text: str
    filters: GeoFilters | None = None


class GeoSearchResponse(BaseModel):
    suggestions: list[str] | None = None


class RegionData(BaseModel):
    region: str
    districts: list[str]


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


class ReverseGeoCodeLocation(BaseModel):
    country: str
    region: str
    district: str


class Location(BaseModel):
    country: str
    region: str
    district: str
    gathering_place: str | None = None
    coordinate_north: str | None = None
    coordinate_east: str | None = None
    grads_north: str | None = None
    mins_north: str | None = None
    secs_north: str | None = None
    grads_east: str | None = None
    mins_east: str | None = None
    secs_east: str | None = None
    coordinate_format: Literal["grads", "mins", "secs"] | None = None
    geo_origin: Literal["original", "volunteer", "nothing"] | None = None
    geo_uncert: float | None = None
    adm_verbatim: bool | None = None
    geo_REM: str | None = None
