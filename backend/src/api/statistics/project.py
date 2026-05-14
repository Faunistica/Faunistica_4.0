from fastapi import APIRouter

from core.dependencies import DBSession
from repository.stats import get_project_statistics
from schema.statistics import ProjectStatisticsResponse

router = APIRouter()


@router.get("/project")
async def read_project_statistics(
    session: DBSession,
) -> ProjectStatisticsResponse:
    stats = await get_project_statistics(session)
    return ProjectStatisticsResponse(**stats)
