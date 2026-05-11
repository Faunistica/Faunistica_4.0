from datetime import datetime
from typing import Literal

from pydantic import UUID4, BaseModel, ConfigDict, Field as PydanticField

RecordType = Literal["rec_ok", "rec_fail", "check_ok", "check_fail"]


class RecordMetadata(BaseModel):
    id: UUID4

    publ_id: int
    user_id: int

    errors: str | None = None
    type: RecordType | None = None
    created_at: datetime
    updated_at: datetime | None = None

    ip: str | None = None

    def dump_for_update(self) -> dict[str, object]:
        return self.model_dump(
            exclude={"id", "created_at", "ip", "publ_id"}, exclude_unset=True
        )

    model_config = ConfigDict(from_attributes=True)


class RecordData(BaseModel):
    country: str | None = PydanticField(default=None, max_length=255)
    region: str | None = PydanticField(default=None, max_length=255)
    district: str | None = PydanticField(default=None, max_length=255)
    locality: str | None = PydanticField(default=None, max_length=255)
    is_manual_location: bool | None = None
    latitude: str | None = None
    longitude: str | None = None
    verbatimcoordinates: str | None = PydanticField(default=None, max_length=100)
    coordinate_uncertainty: float | None = PydanticField(default=None, gt=0)
    georef_source: str | None = PydanticField(default=None, max_length=50)
    location_remarks: str | None = PydanticField(default=None, max_length=1000)

    verbatim_date: str | None = PydanticField(default=None, max_length=50)
    date_precision: str | None = PydanticField(default=None, max_length=20)
    is_interval: bool | None = None

    habitat: str | None = PydanticField(default=None, max_length=1000)
    sampling_protocol: str | None = PydanticField(default=None, max_length=1000)
    sampling_effort: str | None = PydanticField(default=None, max_length=1000)
    sample_size_value: float | None = PydanticField(default=None, ge=0)
    sample_size_unit: str | None = PydanticField(default=None, max_length=50)
    event_remarks: str | None = PydanticField(default=None, max_length=1000)
    field_number: str | None = PydanticField(default=None, max_length=100)
    catalog_number: str | None = PydanticField(default=None, max_length=100)
    collection_code: str | None = PydanticField(default=None, max_length=100)
    recorded_by: str | None = PydanticField(default=None, max_length=255)

    family: str | None = PydanticField(default=None, max_length=255)
    genus: str | None = PydanticField(default=None, max_length=255)
    species: str | None = PydanticField(default=None, max_length=255)
    tax_verbatim: bool | None = None
    taxon_rank: str | None = PydanticField(default=None, max_length=20)
    type_status: str | None = PydanticField(default=None, max_length=20)
    accepted_name: str | None = PydanticField(default=None, max_length=255)
    taxon_remarks: str | None = PydanticField(default=None, max_length=1000)

    quantity: float | None = PydanticField(default=None, ge=0)
    quantity_type: str | None = PydanticField(default=None, max_length=50)
    sex: str | None = PydanticField(default=None, max_length=20)
    life_stage: str | None = PydanticField(default=None, max_length=20)
    occurrence_remarks: str | None = PydanticField(default=None, max_length=1000)
    identification_remarks: str | None = PydanticField(default=None, max_length=1000)

    model_config = ConfigDict(from_attributes=True)


class RecordFull(RecordData, RecordMetadata): ...
