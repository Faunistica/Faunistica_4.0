from aiogram import Bot
from aiogram.types import (
    BotCommand,
    BotCommandScopeAllPrivateChats,
    KeyboardButton,
    MenuButtonCommands,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
)


def remove() -> ReplyKeyboardRemove:
    return ReplyKeyboardRemove(remove_keyboard=True)


def language_selection() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="1")],
            [KeyboardButton(text="2")],
            [KeyboardButton(text="3")],
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def yes_no() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="Да"), KeyboardButton(text="Нет")]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


commands = [
    BotCommand(command="start", description="Запустить бота"),
    BotCommand(command="menu", description="Меню"),
    BotCommand(command="register", description="Информация о регистрации"),
    BotCommand(command="confirm", description="Подтверждение кода"),
    BotCommand(command="support", description="Поддержка"),
]


async def setup_bot_commands(bot: Bot) -> None:
    """Установка команд бота и кнопки меню"""
    await bot.set_my_commands(commands=commands, scope=BotCommandScopeAllPrivateChats())
    await bot.set_chat_menu_button(menu_button=MenuButtonCommands())
