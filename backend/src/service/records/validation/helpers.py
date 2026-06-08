import re

from schema.records import RecordData
from service.records.validation.constants import CYRILLIC_LANGUAGES

_CYRILLIC_RE = re.compile(r"[А-Яа-яЁё]")

_FORBIDDEN_CHARS_RE = re.compile(r"[\t\n\r\f\v]")


def decimal_places(value: float | str) -> int:
    """Count significant decimal places in a float or string."""
    if isinstance(value, str):
        if "." not in value:
            return 0
        return len(value.split(".")[1])
    s = f"{value:.10f}".rstrip("0")
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
    return bool(re.search(r"[-/–—]", date_str))


def should_skip_geo(data: RecordData) -> bool:
    """Skip geographic coordinate checks when georef_source is 'none' or empty."""
    src = data.georef_source
    return src is None or src.strip() == "" or src.strip().lower() == "none"


_DM_AXIS_RE = re.compile(r"^(\d+)° ([\d.]+)' ([NSEW])$")
_DMS_AXIS_RE = re.compile(r"^(\d+)° (\d+)' ([\d.]+)'' ([NSEW])$")


def split_verbatim_coords(verbatim: str | None) -> tuple[str | None, str | None]:
    """Split '55° 30' N, 60° 55' E' into (lat_part, lon_part)."""
    if verbatim is None:
        return None, None
    p = [s.strip() for s in verbatim.split(",", 1)]
    return (p[0], p[1]) if len(p) == 2 else (None, None)


def axis_finest_dp(axis_str: str | None) -> int | None:
    """decimal_places of finest component in DM/DMS axis string.

    '55° 30.45' N' -> minutes dp, '55° 30' 45.67'' N' -> seconds dp.
    Returns None if not parseable.
    """
    if axis_str is None:
        return None
    m = _DM_AXIS_RE.match(axis_str.strip())
    if m:
        return decimal_places(m.group(2))
    m = _DMS_AXIS_RE.match(axis_str.strip())
    if m:
        return decimal_places(m.group(3))
    return None


def has_cyrillic_in_foreign_text(language: str | None, *fields: str | None) -> bool:
    """Check if non-Cyrillic language text contains Cyrillic characters."""
    if language is None or language in CYRILLIC_LANGUAGES:
        return False
    return any(contains_cyrillic(f) for f in fields)
