from fastapi import APIRouter

from core.dependencies import DBSession, TokenUser
from core.exceptions import AdminOnlyError

from core.security import check_admin
from repository.gamification import get_badges_for_user, create_badge
from repository.gamification import create_badge
from schema.gamification import BadgeCreate, BadgeOut
from service.gamification import check_and_award_badges

router = APIRouter()


@router.get("/my", response_model=list[BadgeOut])
async def my_badges(session: DBSession, current_user: TokenUser):
    rows = await get_badges_for_user(session, current_user.user_id)
    return [
        BadgeOut(
            id=badge.id,
            badge_type=badge.badge_type,
            name=badge.name,
            description=badge.description,
            awarded_at=awarded_at,
        )
        for badge, awarded_at, _ in rows
    ]


@router.get("/user/{user_id}", response_model=list[BadgeOut])
async def user_badges(user_id: int, session: DBSession, current_user: TokenUser):
    rows = await get_badges_for_user(session, user_id)
    return [
        BadgeOut(
            id=badge.id,
            badge_type=badge.badge_type,
            name=badge.name,
            description=badge.description,
            awarded_at=awarded_at,
        )
        for badge, awarded_at, _ in rows
    ]


@router.post("/admin", response_model=BadgeOut, status_code=201)
async def create_thematic_badge(
    data: BadgeCreate, session: DBSession, current_user: TokenUser
):
    await check_admin(session, current_user.user_id)
    badge = await create_badge(session, **data.model_dump())
    await session.commit()
    await session.refresh(badge)
    return BadgeOut(
        id=badge.id,
        badge_type=badge.badge_type,
        name=badge.name,
        description=badge.description,
        awarded_at=badge.created_at,
    )

@router.post("/check/{user_id}", status_code=200)
async def check_badges(user_id: int, session: DBSession, current_user: TokenUser):
    awarded = await check_and_award_badges(session, user_id)
    await session.commit()
    return {"awarded": awarded}