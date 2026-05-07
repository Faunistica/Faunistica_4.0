from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

RecordType = Literal["rec_ok", "rec_fail", "check_ok", "check_fail"]


class RecordMetadata(BaseModel):
    id: UUID

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

    model_config = ConfigDict(from_attributes=True)


class RecordFull(RecordData, RecordMetadata): ...
