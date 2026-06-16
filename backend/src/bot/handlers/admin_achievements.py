import io
import logging

from aiogram import Router
from aiogram.filters import Command
from aiogram.types import BufferedInputFile, Message
from openpyxl import Workbook

from bot.i18n import BotLanguage, Messages
from core.config import settings
from core.dependencies import get_session
from repository.stats import get_volunteers_achievements

logger = logging.getLogger(__name__)
router = Router()


@router.message(Command("achievements"))
async def achievements_command(message: Message, lang: BotLanguage) -> None:
    if message.chat.id != settings.ADMIN_CHAT_ID:
        await message.answer(Messages.no_access_to_command(lang))
        return

    async for session in get_session():
        rows = await get_volunteers_achievements(session)

    wb = Workbook()
    ws = wb.active
    if ws is None:
        msg = "No active worksheet in workbook"
        raise RuntimeError(msg)
    ws.title = "Achievements"
    ws.append(["user_id", "milestone", "datetime", "name", "tlg_name", "tlg_username"])

    for row in rows:
        ws.append(
            [
                row.user_id,
                row.object,
                row.datetime,
                row.name,
                row.tlg_name,
                row.tlg_username,
            ]
        )

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    await message.answer_document(
        document=BufferedInputFile(
            file=output.read(), filename="volunteer_achievements.xlsx"
        ),
        caption="Volunteer achievements (as of now)",
    )
