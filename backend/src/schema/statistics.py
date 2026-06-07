from pydantic import BaseModel

from schema.common import TopSpeciesItem


class ProjectStatisticsResponse(BaseModel):
    total_volunteers: int
    total_records: int
    species_count: int
    processed_publications_count: int
    most_common_family: str | None
    most_common_genus: str | None
    most_common_species: str | None


class UserStatisticsResponse(BaseModel):
    user_id: int
    name: str | None
    records_entered: int
    publications_processed: int
    most_common_family: str | None
    most_common_genus: str | None
    most_common_species: str | None
    top_species: list[TopSpeciesItem]
