from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import Action, EventRecord
from schema.common import MilestoneInfo
from service.actions import ActionService

logger = __import__("logging").getLogger(__name__)


async def check_and_log_milestone(
    session: AsyncSession,
    user_id: int,
    new_record: EventRecord,
    action_service: ActionService | None = None,
) -> MilestoneInfo | None:
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

    if count % 50 != 0:
        return None

    existing_stmt = select(Action).where(
        Action.user_id == user_id,
        Action.action == "fau_50",
        Action.object == f"{count}",
    )
    existing = await session.execute(existing_stmt)
    if existing.scalar_one_or_none() is not None:
        return None

    milestone_datetime = new_record.created_at

    milestone_info = MilestoneInfo(
        user_id=user_id,
        milestone=count,
        datetime=milestone_datetime,
    )

    # Use ActionService if provided, otherwise create one
    if action_service is None:
        action_service = ActionService(session)
    await action_service.log_milestone(user_id, count, None)

    logger.info(
        "Milestone detected: user_id=%s, milestone=50, datetime=%s",
        user_id,
        new_record.created_at,
    )

    return milestone_info
