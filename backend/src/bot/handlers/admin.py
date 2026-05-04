from datetime import datetime
from pathlib import Path

from aiogram import Bot, Router
from aiogram.filters import Command
from aiogram.types import FSInputFile, Message

from bot.messages import Messages
from core.config import settings

router = Router()


class HandlerError(Exception):
    MSG_INCORRECTLY_CONFIGURED = "incorrectly configured handler"


@router.message(Command("reply"))
async def reply_to_user_command(message: Message, bot: Bot) -> None:
    if message.text is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

    if message.chat.id != settings.ADMIN_CHAT_ID:
        await message.answer(Messages.no_access_to_command())
        return

    if message.reply_to_message is None or message.reply_to_message.text is None:
        await message.answer(Messages.using_command_reply())
        return

    reply_text = (
        message.text.replace("/reply@FaunisticaV3Bot", "").replace("/reply", "").strip()
    )
    if not reply_text:
        await message.answer(Messages.empty_response_to_user())
        return

    original_message = message.reply_to_message.text
    try:
        user_id = int(
            original_message.replace("\n", " ").split("ID: ")[1].split(" ")[0]
        )
    except (IndexError, ValueError):
        await message.answer(Messages.could_not_extract_id())
        return

    await bot.send_message(user_id, Messages.response_from_support(reply_text))
    await message.answer(Messages.response_sent())


@router.message(Command("logs"))
async def send_logs_command(message: Message) -> None:
    if message.text is None:
        raise HandlerError(HandlerError.MSG_INCORRECTLY_CONFIGURED)

    if message.chat.id != settings.ADMIN_CHAT_ID:
        await message.answer(Messages.no_access_to_command())
        return

    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        await message.answer(Messages.incorrect_date())
        return

    date_str = args[1]
    try:
        files_to_send = await _get_log_files(date_str)

        if len(files_to_send) == 0:
            await message.answer(Messages.logs_not_found(date_str))

            dates = set()
            logs_dir = settings.LOGS_DIR
            for file in logs_dir.glob("*.log*"):
                try:
                    date_part = file.name.split(".")[-1]
                    datetime.strptime(date_part, "%Y-%m-%d")
                    dates.add(f"\n{date_part}")
                except ValueError:
                    continue

            await message.answer(Messages.available_log_dates(dates))
            return

        for name, path in files_to_send:
            await message.answer_document(
                document=FSInputFile(path, filename=f"{name}.{date_str}"),
                caption=f"{name} за {date_str}",
            )

    except ValueError:
        await message.answer(Messages.incorrect_date())
    except Exception:
        await message.answer(Messages.unexpected_error())


async def _get_log_files(date_str: str) -> list[tuple[str, Path]]:
    logs_dir = settings.LOGS_DIR
    if date_str.lower() == "сегодня":
        service_log = logs_dir / "service.log"
        errors_log = logs_dir / "errors.log"
    else:
        date = datetime.strptime(date_str, "%Y-%m-%d")
        date_str = date.strftime("%Y-%m-%d")

        service_log = logs_dir / f"service.log.{date_str}"
        errors_log = logs_dir / f"errors.log.{date_str}"

    files_to_send: list[tuple[str, Path]] = []
    if service_log.exists():
        files_to_send.append(("service.log", service_log))

    if errors_log.exists():
        files_to_send.append(("errors.log", errors_log))

    return files_to_send
