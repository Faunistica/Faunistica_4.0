from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from schema.records import RecordData


_CYRILLIC_RE = re.compile(r"[А-Яа-яЁё]")

_FORBIDDEN_CHARS_RE = re.compile(r"[\t\n\r\f\v]")


def decimal_places(n: float) -> int:
    """Count significant decimal places in a float."""
    s = f"{n:.10f}".rstrip("0")
    if "." not in s:
        return 0
    return len(s.split(".")[1])


def contains_cyrillic(text: str | None) -> bool:
    if not text:
        return False
    return bool(_CYRILLIC_RE.search(text))


def contains_forbidden_chars(*fields: str | None) -> bool:
    return any(f and _FORBIDDEN_CHARS_RE.search(f) for f in fields)


def has_range_separator(date_str: str | None) -> bool:
    if not date_str:
        return False
    return bool(re.search(r"[-/–]", date_str))


def should_skip_geo(data: RecordData) -> bool:
    """Skip geographic coordinate checks when georef_source is 'none' or empty."""
    src = data.georef_source
    return src is None or src.strip() == "" or src.strip().lower() == "none"
