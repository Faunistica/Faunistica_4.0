from pydantic import BaseModel


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
