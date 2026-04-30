from datetime import datetime

from sqlalchemy import Integer, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import Action, EventRecord

logger = __import__("logging").getLogger(__name__)


async def detect_milestones(session: AsyncSession) -> list[dict[str, int | datetime]]:
    stmt = (
        select(
            EventRecord.user_id,
            func.count().label("reached"),
        )
        .where(EventRecord.type == "rec_ok")
        .group_by(EventRecord.user_id)
    )
    result = await session.execute(stmt)
    record_count = result.all()

    if not record_count:
        return []

    user_ids = [row.user_id for row in record_count]

    stmt = (
        select(
            Action.user_id,
            func.max(cast(Action.object, Integer)).label("recorded"),
        )
        # NOTE: is looks like fau_100 milestones are deprecated
        .where(Action.action == "fau_50")
        .where(Action.user_id.in_(user_ids))
        .group_by(Action.user_id)
    )
    result = await session.execute(stmt)
    last_milestones: dict = {row.user_id: row.recorded for row in result}

    new_milestones: list[dict[str, int | datetime]] = []

    for row in record_count:
        user_id = row.user_id
        reached = row.reached
        fix = (reached // 50) * 50

        if fix <= 0:
            continue

        recorded = last_milestones.get(user_id, 0)

        if fix <= recorded:
            continue

        crossing_rec_stmt = (
            select(EventRecord.created_at)
            .where(
                EventRecord.user_id == user_id,
                EventRecord.type == "rec_ok",
            )
            .order_by(EventRecord.created_at)
            .offset(fix - 1)
            .limit(1)
        )
        crossing_rec_result = await session.execute(crossing_rec_stmt)
        crossing_rec = crossing_rec_result.scalar_one_or_none()

        milestone_datetime = crossing_rec or datetime.now()

        action = Action(
            user_id=user_id,
            action=f"fau_{fix}",
            object=str(fix),
            datetime=milestone_datetime,
        )
        session.add(action)

        new_milestones.append(
            {"user_id": user_id, "milestone": fix, "datetime": milestone_datetime}
        )

    await session.commit()

    for m in new_milestones:
        logger.info(
            "Milestone detected: user_id=%s, milestone=%s, datetime=%s",
            m["user_id"],
            m["milestone"],
            m["datetime"],
        )

    return new_milestones
