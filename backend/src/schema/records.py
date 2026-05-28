from datetime import datetime
from typing import Literal, TypedDict

from pydantic import UUID4, BaseModel, ConfigDict, Field, field_validator

from core.enums import RecordType

# Valid (sex, life_stage) combinations - only 6 are allowed
# Matches frontend specimen field mappings in frontend/src/lib/recordUtils.ts
VALID_SPECIMEN_COMBINATIONS: frozenset[tuple[str, str]] = frozenset(
    {
        ("male", "adult"),  # males field
        ("male", "subadult"),  # subadultMales field
        ("female", "adult"),  # females field
        ("female", "subadult"),  # subadultFemales field
        ("none", "adult"),  # adults field
        ("none", "juvenile"),  # juveniles field
    }
)


class SpecimenDbRow(TypedDict, total=False):
    quantity: float | int
    sex: str | None
    life_stage: str | None


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
    coordinate_uncertainty: float | None = None
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

    @field_validator("specimens", mode="after")
    @classmethod
    def filter_invalid_specimen_combinations(
        cls, v: list[Specimen] | None
    ) -> list[Specimen] | None:
        """Filter out specimens with invalid sex/life_stage combinations.

        Only 6 combinations are valid, matching frontend specimen fields:
        - male + adult (males)
        - male + subadult (subadultMales)
        - female + adult (females)
        - female + subadult (subadultFemales)
        - none + adult (adults)
        - none + juvenile (juveniles)
        """
        if v is None:
            return None
        if any((s.sex, s.life_stage) not in VALID_SPECIMEN_COMBINATIONS for s in v):
            raise ValueError("Invalid specimen sex/life_stage combination")
        return v


class RecordFull(RecordData, RecordMetadata): ...
