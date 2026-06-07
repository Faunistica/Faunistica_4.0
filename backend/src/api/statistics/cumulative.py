from fastapi import APIRouter

from core.dependencies import DBSession
from repository.stats import get_cumulative_records, get_cumulative_volunteers
from schema.statistics import CumulativePoint, CumulativeResponse

router = APIRouter()


@router.get("/cumulative/volunteers")
async def cumulative_volunteers(session: DBSession) -> CumulativeResponse:
    rows = await get_cumulative_volunteers(session)
    cumulative = 0
    points = []
    for row in rows:
        cumulative += row.cnt
        points.append(CumulativePoint(date=row.date, count=cumulative))
    return CumulativeResponse(data=points)


@router.get("/cumulative/records")
async def cumulative_records(session: DBSession) -> CumulativeResponse:
    rows = await get_cumulative_records(session)
    cumulative = 0
    points = []
    for row in rows:
        cumulative += row.cnt
        points.append(CumulativePoint(date=row.date, count=cumulative))
    return CumulativeResponse(data=points)
