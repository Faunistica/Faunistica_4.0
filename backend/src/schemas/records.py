from typing import Literal

from pydantic import BaseModel


class SpecimenCount(BaseModel):
    gender: Literal["male", "female", "undefined"]
    maturity: Literal["adult", "juvenile"]
    count: float | None = None


class SpecimenCounts(BaseModel):
    specimens: list[SpecimenCount] = []


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
    specimens: SpecimenCounts | None = None
    taxonomic_notes: str | None = None
    type_status: str | None = None


class GetRecordResponse(BaseModel):
    id: int
    type: str | None = None
    countrycode: str | None = None
    stateprovince: str | None = None
    county: str | None = None
    verbatimlocality: str | None = None
    decimallatitude: float | None = None
    decimallongitude: float | None = None
    verbatimlatitude: str | None = None
    verbatimlongitude: str | None = None
    georeferencedby: str | None = None
    locationremarks: str | None = None
    eve_YY: int | None = None
    eve_MM: int | None = None
    eve_DD: int | None = None
    day_defined: bool | None = None
    habitat: str | None = None
    samplingeffort: str | None = None
    recordedby: str | None = None
    eventremarks: str | None = None
    family: str | None = None
    genus: str | None = None
    specificepithet: str | None = None
    taxonrank: bool | None = None
    tax_nsp: bool | None = None
    type_status: str | None = None
    taxonremarks: str | None = None
    organismquantity: int | None = None
    abu_details: str | None = None
    occurrenceremarks: str | None = None
    coordinateuncertaintyinmeters: float | None = None
    eve_YY_end: int | None = None
    eve_MM_end: int | None = None
    eve_DD_end: int | None = None


class EditRecordRequest(BaseModel):
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
