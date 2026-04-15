from typing import TypeVar

T = TypeVar("T")


def clean_value(value: T | None) -> T | None:
    if value in ("", None, [], 0, 0.0):
        return None
    return value
