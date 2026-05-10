from datetime import datetime
from typing import Literal

from pydantic import UUID4, BaseModel, ConfigDict, field_validator

RecordType = Literal["rec_ok", "rec_fail", "check_ok", "check_fail"]


class RecordMetadata(BaseModel):
    id: UUID4

    publ_id: int
    user_id: int

    errors: str | None = None
    type: RecordType | None = None
    created_at: datetime
    updated_at: datetime | None = None

    # TODO: don't send to the client?
    ip: str | None = None

    def dump_for_update(self) -> dict[str, object]:
        return self.model_dump(
            exclude={"id", "created_at", "ip", "publ_id"}, exclude_unset=True
        )

    model_config = ConfigDict(from_attributes=True)


class RecordData(BaseModel):
    country: str | None = None
    region: str | None = None
    district: str | None = None
    locality: str | None = None
    is_manual_location: bool | None = None
    latitude: float | None = None
    longitude: float | None = None
    verbatimcoordinates: str | None = None
    coordinate_uncertainty: float | None = None
    georef_source: str | None = None
    location_remarks: str | None = None

    verbatim_date: str | None = None
    date_precision: str | None = None
    is_interval: bool | None = None

    habitat: str | None = None
    sampling_protocol: str | None = None
    sampling_effort: str | None = None
    sample_size_value: float | None = None
    sample_size_unit: str | None = None
    event_remarks: str | None = None
    field_number: str | None = None
    catalog_number: str | None = None
    collection_code: str | None = None
    recorded_by: str | None = None

    family: str | None = None
    genus: str | None = None
    species: str | None = None
    tax_verbatim: bool | None = None
    taxon_rank: str | None = None
    type_status: str | None = None
    accepted_name: str | None = None
    taxon_remarks: str | None = None

    quantity: float | None = None
    quantity_type: str | None = None
    sex: str | None = None
    life_stage: str | None = None
    occurrence_remarks: str | None = None
    identification_remarks: str | None = None

    @field_validator(
        "country",
        "region",
        "district",
        "locality",
        "family",
        "genus",
        "species",
        "accepted_name",
        "recorded_by",
    )
    @classmethod
    def max_255(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 255:
            raise ValueError("Must be 255 characters or less")
        return v

    @field_validator(
        "field_number", "catalog_number", "collection_code", "verbatimcoordinates"
    )
    @classmethod
    def max_100(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 100:
            raise ValueError("Must be 100 characters or less")
        return v

    @field_validator(
        "location_remarks",
        "habitat",
        "sampling_protocol",
        "sampling_effort",
        "event_remarks",
        "taxon_remarks",
        "identification_remarks",
        "occurrence_remarks",
    )
    @classmethod
    def max_1000(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 1000:
            raise ValueError("Must be 1000 characters or less")
        return v

    @field_validator("latitude")
    @classmethod
    def latitude_range(cls, v: float | None) -> float | None:
        if v is not None and (v < -90 or v > 90):
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("longitude")
    @classmethod
    def longitude_range(cls, v: float | None) -> float | None:
        if v is not None and (v < -180 or v > 180):
            raise ValueError("Longitude must be between -180 and 180")
        return v

    @field_validator("coordinate_uncertainty")
    @classmethod
    def coord_uncertainty_positive(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("Coordinate uncertainty must be positive")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_non_negative(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("Quantity must be non-negative")
        return v

    @field_validator("sample_size_value")
    @classmethod
    def sample_size_non_negative(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("Sample size must be non-negative")
        return v

    model_config = ConfigDict(from_attributes=True)


class RecordFull(RecordData, RecordMetadata): ...
