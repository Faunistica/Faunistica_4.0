from datetime import datetime
from typing import Literal, TypedDict

from pydantic import UUID4, BaseModel, ConfigDict, Field


class SpecimenDbRow(TypedDict, total=False):
    quantity: float | int
    sex: str | None
    life_stage: str | None


RecordType = Literal["rec_ok", "rec_fail", "check_ok", "check_fail", "rec_del"]


class Specimen(BaseModel):
    sex: Literal["male", "female", "none"]
    life_stage: Literal["adult", "subadult", "juvenile", "none"]
    count: float


class RecordMetadata(BaseModel):
    id: UUID4

    publ_id: int
    user_id: int

    errors: str | None = None
    type: RecordType | None = None
    created_at: datetime
    updated_at: datetime

    ip: str | None = None

    def dump_for_update(self) -> dict[str, object]:
        return self.model_dump(
            exclude={"id", "created_at", "ip", "publ_id"}, exclude_unset=True
        )

    model_config = ConfigDict(from_attributes=True)


class RecordData(BaseModel):
    country: str | None = Field(default=None, max_length=255)
    region: str | None = Field(default=None, max_length=255)
    district: str | None = Field(default=None, max_length=255)
    locality: str | None = Field(default=None, max_length=255)
    is_manual_location: bool | None = None
    latitude: str | None = Field(default=None, max_length=255)
    longitude: str | None = Field(default=None, max_length=255)
    verbatimcoordinates: str | None = Field(default=None, max_length=100)
    coordinate_uncertainty: float | None
    georef_source: str | None = Field(default=None, max_length=50)
    location_remarks: str | None = Field(default=None, max_length=1000)

    verbatim_date: str | None = Field(default=None, max_length=50)
    date_precision: str | None = Field(default=None, max_length=20)
    is_interval: bool | None = None

    habitat: str | None = Field(default=None, max_length=1000)
    sampling_protocol: str | None = Field(default=None, max_length=1000)
    sampling_effort: str | None = Field(default=None, max_length=1000)
    sample_size_value: float | None = None
    sample_size_unit: str | None = Field(default=None, max_length=50)
    event_remarks: str | None = Field(default=None, max_length=1000)
    field_number: str | None = Field(default=None, max_length=100)
    catalog_number: str | None = Field(default=None, max_length=100)
    collection_code: str | None = Field(default=None, max_length=100)
    recorded_by: str | None = Field(default=None, max_length=255)

    family: str | None = Field(default=None, max_length=255)
    genus: str | None = Field(default=None, max_length=255)
    species: str | None = Field(default=None, max_length=255)
    tax_verbatim: bool | None = None
    taxon_rank: str | None = Field(default=None, max_length=20)
    type_status: str | None = Field(default=None, max_length=20)
    accepted_name: str | None = Field(default=None, max_length=255)
    taxon_remarks: str | None = Field(default=None, max_length=1000)

    quantity_type: str | None = Field(default=None, max_length=50)
    specimens: list[Specimen] | None = None
    occurrence_remarks: str | None = Field(default=None, max_length=1000)
    identification_remarks: str | None = Field(default=None, max_length=1000)

    model_config = ConfigDict(from_attributes=True)


class RecordFull(RecordData, RecordMetadata): ...
