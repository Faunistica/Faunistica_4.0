from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from schemas.common import UNSET, Unset


class RecordBase(BaseModel):
    publ_id: int
    user_id: int


class RecordFull(RecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID

    errors: str | None = None
    type: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    ip: str | None = None

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


class RecordUpdate(BaseModel):
    id: UUID | None | Unset = UNSET
    publ_id: int | None | Unset = UNSET
    user_id: int | None | Unset = UNSET
    created_at: datetime | None | Unset = UNSET
    updated_at: datetime | None | Unset = UNSET
    ip: str | None | Unset = UNSET
    errors: str | None | Unset = UNSET
    type: str | None | Unset = UNSET

    country: str | None | Unset = UNSET
    region: str | None | Unset = UNSET
    district: str | None | Unset = UNSET
    locality: str | None | Unset = UNSET
    is_manual_location: bool | None | Unset = UNSET
    latitude: float | None | Unset = UNSET
    longitude: float | None | Unset = UNSET
    verbatimcoordinates: str | None | Unset = UNSET
    coordinate_uncertainty: float | None | Unset = UNSET
    georef_source: str | None | Unset = UNSET
    location_remarks: str | None | Unset = UNSET

    verbatim_date: str | None | Unset = UNSET
    date_precision: str | None | Unset = UNSET
    is_interval: bool | None | Unset = UNSET

    habitat: str | None | Unset = UNSET
    sampling_protocol: str | None | Unset = UNSET
    sampling_effort: str | None | Unset = UNSET
    sample_size_value: float | None | Unset = UNSET
    sample_size_unit: str | None | Unset = UNSET
    event_remarks: str | None | Unset = UNSET
    field_number: str | None | Unset = UNSET
    catalog_number: str | None | Unset = UNSET
    collection_code: str | None | Unset = UNSET
    recorded_by: str | None | Unset = UNSET

    family: str | None | Unset = UNSET
    genus: str | None | Unset = UNSET
    species: str | None | Unset = UNSET
    tax_verbatim: bool | None | Unset = UNSET
    taxon_rank: str | None | Unset = UNSET
    type_status: str | None | Unset = UNSET
    accepted_name: str | None | Unset = UNSET
    taxon_remarks: str | None | Unset = UNSET

    quantity: float | None | Unset = UNSET
    quantity_type: str | None | Unset = UNSET
    sex: str | None | Unset = UNSET
    life_stage: str | None | Unset = UNSET
    occurrence_remarks: str | None | Unset = UNSET
    identification_remarks: str | None | Unset = UNSET
