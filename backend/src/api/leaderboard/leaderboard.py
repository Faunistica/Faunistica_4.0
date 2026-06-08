from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from core.dependencies import DBSession, TokenUser
from repository.gamification import get_leaderboard, get_user_rank, refresh_leaderboard
from schema.gamification import LeaderboardEntry, LeaderboardResponse, MyRankResponse

router = APIRouter()

VALID_PERIODS = {"all_time", "monthly", "weekly"}


@router.get("/", response_model=LeaderboardResponse)
async def leaderboard(
    session: DBSession,
    current_user: TokenUser,
    period: Annotated[str, Query()] = "all_time",
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
):
    if period not in VALID_PERIODS:
        raise HTTPException(400, f"period must be one of {VALID_PERIODS}")
    rows = await get_leaderboard(session, period, limit)
    entries = [
        LeaderboardEntry(
            rank=r.rank,
            rank_delta=r.rank_delta,
            user_id=r.user_id,
            name=r.name,
            record_count=r.record_count,
        )
        for r in rows
    ]
    return LeaderboardResponse(period=period, entries=entries)


@router.get("/me", response_model=MyRankResponse)
async def my_rank(
    session: DBSession,
    current_user: TokenUser,
    period: Annotated[str, Query()] = "all_time",
):
    snap = await get_user_rank(session, current_user.user_id, period)
    if snap is None:
        raise HTTPException(404, "No ranking data yet")
    return MyRankResponse(
        period=period,
        rank=snap.rank,
        rank_delta=snap.rank_delta,
        record_count=snap.record_count,
    )


@router.post("/refresh", status_code=200)
async def refresh(
    session: DBSession,
    current_user: TokenUser,
    period: Annotated[str, Query()] = "all_time",
):
    if period not in VALID_PERIODS:
        raise HTTPException(400, "invalid period")
    await refresh_leaderboard(session, period)
    await session.commit()
    return {"status": "ok", "period": period}