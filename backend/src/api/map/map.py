from fastapi import APIRouter

from core.dependencies import DBSession, TokenUser
from repository.gamification import get_user_map_records
from schema.gamification import MapRecordOut

router = APIRouter()


@router.get("/my", response_model=list[MapRecordOut])
async def my_map(session: DBSession, current_user: TokenUser):
    rows = await get_user_map_records(session, current_user.user_id)
    return [
        MapRecordOut(
            id=str(r.id),
            latitude=float(r.latitude) if r.latitude else None,
            longitude=float(r.longitude) if r.longitude else None,
            genus=r.genus,
            species=r.species,
            created_at=r.created_at,
        )
        for r in rows
    ]