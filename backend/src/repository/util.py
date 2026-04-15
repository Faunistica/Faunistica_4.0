import logging
from typing import ParamSpec, TypeVar

from model import EventDate

logger = logging.getLogger(__name__)


P = ParamSpec("P")
R = TypeVar("R")


def format_event_date(date: EventDate) -> str:
    def fmt(y: int | None, m: int | None, d: int | None) -> str:
        parts = []
        if y:
            parts.append(str(y))
            if m:
                parts.append(f"{m:02}")
                if d:
                    parts.append(f"{d:02}")
        return ".".join(parts)

    start = fmt(date.yy, date.mm, date.dd)
    end = fmt(date.yy_end, date.mm_end, date.dd_end)

    return f"{start} – {end}" if end else start
