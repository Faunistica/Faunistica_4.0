from datetime import datetime
from pydantic import BaseModel


class BadgeOut(BaseModel):
    id: int
    badge_type: str
    name: str
    description: str | None
    awarded_at: datetime

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    rank: int
    rank_delta: int | None
    user_id: int
    name: str | None
    record_count: int


class LeaderboardResponse(BaseModel):
    period: str
    entries: list[LeaderboardEntry]


class MyRankResponse(BaseModel):
    period: str
    rank: int
    rank_delta: int | None
    record_count: int


class MarathonOut(BaseModel):
    id: int
    name: str
    description: str | None
    starts_at: datetime
    ends_at: datetime
    rules: dict | None

    model_config = {"from_attributes": True}


class MarathonCreate(BaseModel):
    name: str
    description: str | None = None
    starts_at: datetime
    ends_at: datetime
    rules: dict | None = None


class BadgeCreate(BaseModel):
    badge_type: str
    name: str
    description: str | None = None
    conditions: dict | None = None


class MapRecordOut(BaseModel):
    id: str
    latitude: float | None
    longitude: float | None
    genus: str | None
    species: str | None
    created_at: datetime