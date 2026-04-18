from pydantic import BaseModel


class UserRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    user_name: str


class InfoRequest(BaseModel):
    text: str


class InfoResponse(BaseModel):
    country: str | None = None
    region: str | None = None
    district: str | None = None
    gathering_place: str | None = None
    coordinate_north: dict[str, float | None] | None = None
    coordinate_east: dict[str, float | None] | None = None
    date: str | None = None
    family: str | None = None
    genus: str | None = None
    species: str | None = None
    collector: str | None = None
    count_males: int | None = None
    count_females: int | None = None
    count_juv_male: int | None = None
    count_juv_female: int | None = None
    count_juv: int | None = None


class InsertRecordsRequest(BaseModel):
    abu_ind_rem: str | None = None
    adm_verbatim: bool | None = None
    begin_day: int | None = None
    begin_month: int | None = None
    begin_year: int | None = None
    biotope: str | None = None
    collector: str | None = None
    country: str | None = None
    district: str | None = None
    east: str | None = None
    end_day: int | None = None
    end_month: int | None = None
    end_year: int | None = None
    eve_REM: str | None = None
    family: str | None = None
    genus: str | None = None
    geo_origin: str | None = None
    geo_REM: str | None = None
    geo_uncert: float | None = None
    is_defined_species: bool | None = None
    is_in_wsc: bool | None = None
    is_new_species: bool | None = None
    measurement_units: str | None = None
    north: str | None = None
    place: str | None = None
    place_notes: str | None = None
    region: str | None = None
    selective_gain: str | None = None
    species: str | None = None
    specimens: dict[str, float | None] | None = None
    taxonomic_notes: str | None = None
    type_status: str | None = None


class SpeciesStats(BaseModel):
    species: str
    count: int


class LatestRecord(BaseModel):
    datetime: str
    species: str
    location: str
    username: str


class StatisticsResponse(BaseModel):
    total_publications: int
    processed_publications: int
    total_species: int
    unique_species: int
    top_species: list[SpeciesStats]
    latest_records: list[LatestRecord]


class GeoSearchRequest(BaseModel):
    field: str
    text: str
    filters: dict[str, str | None] | None = None


class GeoSearchResponse(BaseModel):
    suggestions: list[str] | None = None


class SuggestTaxonRequest(BaseModel):
    field: str
    text: str
    filters: dict[str, str | None] | None = None


class SuggestTaxonResponse(BaseModel):
    suggestions: list[str] | None = None


class PublResponse(BaseModel):
    author: str | None = None
    year: str | None = None
    name: str | None = None
    pdf_file: str | None = None


class AutofillTaxonRequest(BaseModel):
    field: str
    text: str


class AutofillTaxonResponse(BaseModel):
    family: str | None = None
    genus: str | None = None


class SupportRequest(BaseModel):
    link: str
    user_name: str
    text: str
    issue_type: str


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


class RemoveRecordRequest(BaseModel):
    hash: str


class GetRecordRequest(BaseModel):
    hash: str


class GetRecordResponse(BaseModel):
    hash: str
    type: str | None = None
    adm_country: str | None = None
    adm_region: str | None = None
    adm_district: str | None = None
    adm_loc: str | None = None
    geo_nn_raw: str | None = None
    geo_ee_raw: str | None = None
    geo_origin: str | None = None
    geo_REM: str | None = None
    eve_YY: int | None = None
    eve_MM: int | None = None
    eve_DD: int | None = None
    eve_day_def: bool | None = None
    eve_habitat: str | None = None
    eve_effort: str | None = None
    abu_coll: str | None = None
    eve_REM: str | None = None
    tax_fam: str | None = None
    tax_gen: str | None = None
    tax_sp: str | None = None
    tax_sp_def: bool | None = None
    tax_nsp: bool | None = None
    type_status: str | None = None
    tax_REM: str | None = None
    abu: int | None = None
    abu_details: str | None = None
    abu_ind_rem: str | None = None
    geo_uncert: float | None = None
    eve_YY_end: int | None = None
    eve_MM_end: int | None = None
    eve_DD_end: int | None = None


class EditRecordRequest(BaseModel):
    hash: str
    type: str | None = None
    adm_country: str | None = None
    adm_region: str | None = None
    adm_district: str | None = None
    adm_loc: str | None = None
    geo_nn_raw: str | None = None
    geo_ee_raw: str | None = None
    geo_origin: str | None = None
    geo_REM: str | None = None
    eve_YY: int | None = None
    eve_MM: int | None = None
    eve_DD: int | None = None
    eve_day_def: bool | None = None
    eve_habitat: str | None = None
    eve_effort: str | None = None
    abu_coll: str | None = None
    eve_REM: str | None = None
    tax_fam: str | None = None
    tax_gen: str | None = None
    tax_sp: str | None = None
    tax_sp_def: bool | None = None
    tax_nsp: bool | None = None
    type_status: str | None = None
    tax_REM: str | None = None
    abu: int | None = None
    abu_details: str | None = None
    abu_ind_rem: str | None = None
    geo_uncert: float | None = None
    eve_YY_end: int | None = None
    eve_MM_end: int | None = None
    eve_DD_end: int | None = None


class RecordHashRequest(BaseModel):
    hash: str


class Message[T](BaseModel):
    message: T


class PublData(BaseModel):
    author: str | None = None
    year: str | None = None
    name: str | None = None
    pdf_file: str | None = None


class LocationList(BaseModel):
    region: str
    districts: list[str]


class Location(BaseModel):
    country: str
    region: str
    district: str


class EventDate(BaseModel):
    yy: int | None = None
    mm: int | None = None
    dd: int | None = None
    yy_end: int | None = None
    mm_end: int | None = None
    dd_end: int | None = None
