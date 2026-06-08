from sqlalchemy.ext.asyncio import AsyncSession

from repository.gamification import award_badge, get_all_active_badges
from repository.stats import get_user_statistics


async def check_and_award_badges(session: AsyncSession, user_id: int) -> list[str]:
    """Проверяет все условия и выдаёт значки. Возвращает список названий выданных."""
    stats = await get_user_statistics(session, user_id)
    record_count = stats["records_entered"]

    badges = await get_all_active_badges(session)
    awarded_names = []

    for badge in badges:
        if badge.badge_type == "record_count" and badge.record_threshold:
            if record_count >= badge.record_threshold:
                if await award_badge(session, user_id, badge.id):
                    awarded_names.append(badge.name)

    return awarded_names