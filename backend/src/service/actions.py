import logging
from datetime import datetime

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import ActionLoggingError
from core.model import Action
from schema.common import MilestoneInfo, WinnerInfo

logger = logging.getLogger(__name__)


class ActionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def save_action(
        self,
        user_id: int,
        action_type: str,
        object: str | None = None,
        ip: str | None = None,
    ) -> None:
        try:
            action = Action(
                user_id=user_id,
                user_ip=ip,
                action=action_type,
                object=object,
                datetime=datetime.now(),
            )
            self.session.add(action)
            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            logger.error("Failed to save action: %s", e, exc_info=True)
            raise ActionLoggingError(str(e)) from e

    async def get_winner_info(self, user_id: int) -> WinnerInfo | None:
        try:
            stmt = (
                select(Action)
                .where(Action.user_id == user_id, Action.action == "fau_win")
                .order_by(desc(Action.datetime))
                .limit(1)
            )
            result = await self.session.execute(stmt)
            action = result.scalar_one_or_none()

            if action is None or action.object is None:
                return None

            parts = action.object.split("|", 1)
            pic = parts[0] if len(parts) > 0 else ""
            msg = parts[1] if len(parts) > 1 else ""

            return WinnerInfo(picfile=pic, message=msg, datetime=action.datetime)
        except Exception as e:
            logger.error("Failed to get winner info: %s", e, exc_info=True)
            return None

    async def get_last_milestone(self, user_id: int) -> MilestoneInfo | None:
        try:
            stmt = (
                select(Action)
                .where(
                    Action.user_id == user_id,
                    Action.action.like("fau_%0"),
                )
                .order_by(desc(Action.datetime))
                .limit(1)
            )
            result = await self.session.execute(stmt)
            action = result.scalar_one_or_none()

            if action is None or action.action is None:
                return None

            milestone_str = action.action.replace("fau_", "")
            try:
                milestone = int(milestone_str)
            except ValueError:
                logger.warning("Invalid milestone format: %s", action.action)
                return None

            return MilestoneInfo(milestone=milestone, action_str=action.object)
        except Exception as e:
            logger.error("Failed to get last milestone: %s", e, exc_info=True)
            return None
