from fastapi import APIRouter

from core.dependencies import DBSession
from repository.stats import get_progress
from schema.statistics import ProgressResponse

router = APIRouter()


@router.get("/progress")
async def progress(session: DBSession) -> ProgressResponse:
    total, distinct_pairs = await get_progress(session)
    if total == 0:
        return ProgressResponse(
            coverage=0.0, total_publications=0, processed_publications=0
        )
    coverage = min(distinct_pairs / (total * 3), 1.0)
    return ProgressResponse(
        coverage=round(coverage, 4),
        total_publications=total,
        processed_publications=distinct_pairs,
    )
