from fastapi import APIRouter, HTTPException

from core.dependencies import DBSession, TokenUser
from core.exceptions import AdminOnlyError
from repository.gamification import (
    award_badge,
    create_marathon,
    get_all_active_badges,
    get_marathon,
    get_marathon_top,
    get_marathons,
)
from schema.gamification import MarathonCreate, MarathonOut

router = APIRouter()


@router.get("/", response_model=list[MarathonOut])
async def list_marathons(session: DBSession, current_user: TokenUser):
    return await get_marathons(session)


@router.get("/{marathon_id}")
async def marathon_detail(marathon_id: int, session: DBSession, current_user: TokenUser):
    m = await get_marathon(session, marathon_id)
    if not m:
        raise HTTPException(404, "Marathon not found")
    top = await get_marathon_top(session, m)
    return {
        "marathon": MarathonOut.model_validate(m),
        "top": [
            {
                "rank": i + 1,
                "user_id": r.user_id,
                "name": r.name,
                "record_count": r.cnt,
            }
            for i, r in enumerate(top)
        ],
    }


@router.post("/", response_model=MarathonOut, status_code=201)
async def create(data: MarathonCreate, session: DBSession, current_user: TokenUser):
    # TODO: admin check
    raise AdminOnlyError()


@router.post("/{marathon_id}/finish", status_code=200)
async def finish_marathon(
    marathon_id: int, session: DBSession, current_user: TokenUser
):
    # TODO: admin check
    m = await get_marathon(session, marathon_id)
    if not m:
        raise HTTPException(404, "Marathon not found")

    top = await get_marathon_top(session, m)
    if not top:
        return {"awarded": []}

    all_badges = await get_all_active_badges(session)
    participant_badge = next(
        (b for b in all_badges if b.badge_type == "marathon_participant"), None
    )
    winner_badge = next(
        (b for b in all_badges if b.badge_type == "marathon_winner"), None
    )

    awarded = []
    for row in top:
        if participant_badge:
            await award_badge(session, row.user_id, participant_badge.id, marathon_id)
            awarded.append({"user_id": row.user_id, "badge": "participant"})

    if winner_badge and top:
        await award_badge(session, top[0].user_id, winner_badge.id, marathon_id)
        awarded.append({"user_id": top[0].user_id, "badge": "winner"})

    await session.commit()
    return {"awarded": awarded}