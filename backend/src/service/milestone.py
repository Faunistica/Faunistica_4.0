from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import Action, EventRecord

logger = __import__("logging").getLogger(__name__)


async def check_and_log_fau50(
    session: AsyncSession,
    user_id: int,
    new_record: EventRecord,
) -> dict[str, int | datetime] | None:
    """
    Check if user just reached 50 rec_ok records.
    Returns milestone info if fau_50 should be logged, None otherwise.
    """
    count_stmt = (
        select(func.count())
        .select_from(EventRecord)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type == "rec_ok",
        )
    )
    result = await session.execute(count_stmt)
    count = result.scalar_one()

    if count != 50:
        return None

    existing_stmt = select(Action).where(
        Action.user_id == user_id,
        Action.action == "fau_50",
    )
    existing = await session.execute(existing_stmt)
    if existing.scalar_one_or_none() is not None:
        return None

    milestone_datetime = new_record.created_at or datetime.now()

    milestone_info: dict[str, int | datetime] = {
        "user_id": user_id,
        "milestone": 50,
        "datetime": milestone_datetime,
    }

    action = Action(
        user_id=user_id,
        action="fau_50",
        object="50",
        datetime=milestone_datetime,
    )
    session.add(action)
    await session.commit()

    logger.info(
        "Milestone detected: user_id=%s, milestone=50, datetime=%s",
        user_id,
        new_record.created_at,
    )

    return milestone_info
