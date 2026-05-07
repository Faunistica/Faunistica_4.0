from aiogram.types import KeyboardButton, ReplyKeyboardMarkup, ReplyKeyboardRemove


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
