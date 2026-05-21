import logging
from datetime import datetime
from json import dumps

from sqlalchemy import desc, select
from sqlalchemy.dialects.postgresql import insert

from core.dependencies import DBSession
from core.exceptions import DBException
from core.model import Action
from schema.common import MilestoneInfo, ProcessingLevel, WinnerInfo

logger = logging.getLogger(__name__)


class ActionService:
    def __init__(self, session: DBSession) -> None:
        self.session = session

    # Command methods - use session.execute(insert(Action)...) NOT session.add()
    # ALL command methods do NOT commit - caller controls transaction

    async def log_publ_complete(
        self, user_id: int, level: ProcessingLevel, publ_id: int, ip: str | None
    ) -> None:
        """Formats object as str(publ_id), action as f"publ_end_{level}"."""
        stmt = insert(Action).values(
            user_id=user_id,
            user_ip=ip,
            action=f"publ_end_{level}",
            object=str(publ_id),
            datetime=datetime.now(),
        )
        await self.session.execute(stmt)

    async def log_publ_metadata(
        self,
        user_id: int,
        publ_id: int,
        urals_scope: str | None,
        material_status: str | None,
        ip: str | None,
    ) -> None:
        """Formats object as JSON with publ_id included."""
        metadata = dumps(
            {
                "publ_id": str(publ_id),
                "reg": urals_scope,
                "mat": material_status,
            }
        )
        stmt = insert(Action).values(
            user_id=user_id,
            user_ip=ip,
            action="publ_rem_json",
            object=metadata,
            datetime=datetime.now(),
        )
        await self.session.execute(stmt)

    async def log_publ_comment(
        self, user_id: int, publ_id: int, comment: str, ip: str | None
    ) -> None:
        """Formats object as f"{publ_id}_comm:{comment}"."""
        stmt = insert(Action).values(
            user_id=user_id,
            user_ip=ip,
            action="publ_rem",
            object=f"{publ_id}_comm:{comment}",
            datetime=datetime.now(),
        )
        await self.session.execute(stmt)

    async def log_win(
        self, user_id: int, picfile: str, message: str, ip: str | None
    ) -> None:
        """Formats object as f"{picfile}|{message}"."""
        stmt = insert(Action).values(
            user_id=user_id,
            user_ip=ip,
            action="fau_win",
            object=f"{picfile}|{message}",
            datetime=datetime.now(),
        )
        await self.session.execute(stmt)

    async def log_login(self, user_id: int, ip: str | None) -> None:
        stmt = insert(Action).values(
            user_id=user_id,
            user_ip=ip,
            action="fau_login",
            object=None,
            datetime=datetime.now(),
        )
        await self.session.execute(stmt)

    async def log_logout(self, user_id: int, ip: str | None) -> None:
        stmt = insert(Action).values(
            user_id=user_id,
            user_ip=ip,
            action="fau_logout",
            object=None,
            datetime=datetime.now(),
        )
        await self.session.execute(stmt)

    async def log_bot_auth(
        self, user_id: int, status: str, ip: str | None = None
    ) -> None:
        stmt = insert(Action).values(
            user_id=user_id,
            user_ip=ip,
            action="bot_auth",
            object=status,
            datetime=datetime.now(),
        )
        await self.session.execute(stmt)

    async def log_bot_rename(
        self, user_id: int, old: str | None, new: str, ip: str | None = None
    ) -> None:
        stmt = insert(Action).values(
            user_id=user_id,
            user_ip=ip,
            action="bot_rename",
            object=f"{old} -> {new}",
            datetime=datetime.now(),
        )
        await self.session.execute(stmt)

    async def log_bot_other(
        self, user_id: int, content_type: str, ip: str | None = None
    ) -> None:
        stmt = (
            insert(Action)
            .on_conflict_do_nothing()
            .values(
                user_id=user_id,
                user_ip=ip,
                action="bot_fun.other",
                object=content_type,
                datetime=datetime.now(),
            )
        )
        await self.session.execute(stmt)

    async def log_milestone(self, user_id: int, milestone: int, ip: str | None) -> None:
        stmt = insert(Action).values(
            user_id=user_id,
            user_ip=ip,
            action="fau_50",
            object=str(milestone),
            datetime=datetime.now(),
        )
        await self.session.execute(stmt)

    # Query methods - update to session.execute(select(...)) style

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
        except DBException as e:
            logger.error("Failed to get winner info: %s", e, exc_info=True)
            return None

    async def is_publication_completed(self, user_id: int, publ_id: int) -> bool:
        stmt = (
            select(Action)
            .where(
                Action.user_id == user_id,
                Action.action.in_(
                    ["publ_end_full", "publ_end_ural", "publ_end_part", "publ_end_skip"]
                ),
                Action.object == str(publ_id),
            )
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def get_last_milestone(self, user_id: int) -> MilestoneInfo | None:
        stmt = (
            select(Action)
            .where(
                Action.user_id == user_id,
                Action.action == "fau_50",
            )
            .order_by(desc(Action.datetime))
            .limit(1)
        )
        result = await self.session.execute(stmt)
        action = result.scalar_one_or_none()

        if action is None:
            return None

        if action.object is None:
            logger.warning("Milestone action object is none")
            raise DBException

        try:
            milestone = int(action.object)
        except ValueError:
            logger.warning("Invalid milestone action object format: %s", action.object)
            raise

        return MilestoneInfo(
            user_id=user_id, milestone=milestone, datetime=action.datetime
        )
