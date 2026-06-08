from fastapi import APIRouter

from core.dependencies import DBSession
from repository.stats import (
    get_cumulative_records,
    get_cumulative_volunteers,
    get_progress,
    get_project_statistics,
)
from schema.statistics import CumulativePoint, ProgressInfo, ProjectStatisticsResponse

router = APIRouter()


@router.get("/project")
async def read_project_statistics(
    session: DBSession,
) -> ProjectStatisticsResponse:
    stats = await get_project_statistics(session)

    vol_rows = await get_cumulative_volunteers(session)
    cumulative = 0
    cumulative_volunteers = []
    for row in vol_rows:
        cumulative += row.cnt
        cumulative_volunteers.append(CumulativePoint(date=row.date, count=cumulative))

    rec_rows = await get_cumulative_records(session)
    cumulative = 0
    cumulative_records = []
    for row in rec_rows:
        cumulative += row.cnt
        cumulative_records.append(CumulativePoint(date=row.date, count=cumulative))

    total, processed = await get_progress(session)
    if total == 0:
        progress = ProgressInfo(
            coverage=0.0, total_publications=0, processed_publications=0
        )
    else:
        coverage = min(processed / total, 1.0)
        progress = ProgressInfo(
            coverage=round(coverage, 4),
            total_publications=total,
            processed_publications=processed,
        )

    return ProjectStatisticsResponse(
        **stats,
        cumulative_volunteers=cumulative_volunteers,
        cumulative_records=cumulative_records,
        progress=progress,
    )
