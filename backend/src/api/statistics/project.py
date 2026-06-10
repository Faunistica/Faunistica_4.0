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
    cumulative_volunteers = [
        CumulativePoint(date=r.date, count=r.cnt) for r in vol_rows
    ]

    rec_rows = await get_cumulative_records(session)
    cumulative_records = [CumulativePoint(date=r.date, count=r.cnt) for r in rec_rows]

    total, processed, fully_processed = await get_progress(session)
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
            fully_processed_publications=fully_processed,
        )

    return ProjectStatisticsResponse(
        **stats,
        cumulative_volunteers=cumulative_volunteers,
        cumulative_records=cumulative_records,
        progress=progress,
    )
