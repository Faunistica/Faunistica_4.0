from datetime import date

from pydantic import BaseModel, ConfigDict

from schema.common import TopSpeciesItem


class CumulativePoint(BaseModel):
    date: date
    count: int


class ProgressInfo(BaseModel):
    coverage: float
    total_publications: int
    processed_publications: int


class ProjectStatisticsResponse(BaseModel):
    total_volunteers: int
    total_records: int
    species_count: int
    processed_publications_count: int
    families_count: int = 0
    checks_count: int = 0
    failed_records: int = 0
    total_users: int = 0
    cumulative_volunteers: list[CumulativePoint] = []
    cumulative_records: list[CumulativePoint] = []
    progress: ProgressInfo | None = None

    model_config = ConfigDict(from_attributes=True)


class UserStatisticsResponse(BaseModel):
    user_id: int
    name: str | None
    records_entered: int
    publications_processed: int
    most_common_family: str | None
    most_common_genus: str | None
    most_common_species: str | None
    top_species: list[TopSpeciesItem]
    checks_count: int = 0
    failed_records: int = 0
    total_individuals: float = 0
    distinct_families: int = 0
    distinct_genera: int = 0
    distinct_species: int = 0
    most_common_year: int | None = None
