import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Action

logger = logging.getLogger(__name__)


async def log_action(
    session: AsyncSession, user_id: int, action: str, object: str
) -> None:
    act = Action(user_id=user_id, action=action, object=object, datetime=datetime.now())
    session.add(act)
    await session.commit()
