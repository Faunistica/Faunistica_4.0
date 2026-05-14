import logging

from aiogram import Bot
from sqlalchemy.ext.asyncio import AsyncSession

from bot.messages import Messages
from core.enums import UserState
from core.exceptions import MsgErr, Ok
from core.model import User
from repository.user import (
    get_user,
)
from service.actions import ActionService

logger = logging.getLogger(__name__)


class UserService:
    def __init__(
        self,
        session: AsyncSession,
        bot: Bot,
        action_service: ActionService,
    ) -> None:
        self.session = session
        self.bot = bot
        self.actions = action_service

    async def check_commands_allowed(
        self, *, user_id: int | None = None, user: User | None = None
    ) -> Ok | MsgErr:
        """
        Check if user can use commands.
        """

        if user is None:
            if user_id is None:
                raise ValueError("both user and user_id are None")

            user = await get_user(self.session, user_id)
            if user is None:
                return MsgErr(error=Messages.not_registered())

        reg_stat = user.reg_stat

        # Switch-case here?
        if reg_stat == UserState.DATA_CLEARED:
            await self.actions.log_bot_other(user.user_id, "not_reg_end")
            error = Messages.register_for_old()
        elif reg_stat.is_in_registration():
            error = Messages.registration_not_finished()
            await self.actions.log_bot_other(user.user_id, "not_reg_end")
        elif reg_stat.is_in_support():
            error = Messages.support_flow_not_finished()
        elif reg_stat.is_in_survey():
            error = Messages.sociology_flow_not_finished()
        elif reg_stat == UserState.RENAME:
            error = Messages.rename_flow_not_finished()
        else:
            return Ok()

        return MsgErr(error=error)
