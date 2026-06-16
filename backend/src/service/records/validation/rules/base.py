from collections.abc import Callable
from dataclasses import dataclass
from enum import StrEnum
from typing import overload

from schema.records import RecordData


class RuleCategory(StrEnum):
    """Categories of validation rules.

    Each category corresponds to a logical group of fields in the record:
        TAXONOMY - taxonomic fields (family, genus, species, etc.)
        GEO - geographic coordinate fields (latitude, longitude, etc.)
        LOCATION - administrative location fields (country, region, etc.)
        EVENT - collection event fields (date, recorder, etc.)
        ABUNDANCE - abundance/occurrence fields (quantity, sex, life stage)
    """

    TAXONOMY = "taxonomy"
    GEO = "geo"
    LOCATION = "location"
    EVENT = "event"
    ABUNDANCE = "abundance"


@dataclass
class RuleContext:
    language: str | None = None

    def t(self, ru: str, en: str | None = None) -> str:
        if self.language == "en" and en is not None:
            return en
        return ru


RuleFunc = Callable[[RecordData, RuleContext], str | None]


@dataclass(frozen=True)
class Rule:
    func: RuleFunc
    category: RuleCategory
    fields: list[str]
    code: str


_RULES: list[Rule] = []


@overload
def rule(
    category: RuleCategory,
    fields: list[str],
    code: str,
) -> Callable[[RuleFunc], RuleFunc]: ...


@overload
def rule(
    category: RuleCategory,
    fields: list[str],
    code: str,
    func: RuleFunc,
) -> RuleFunc: ...


def rule(
    category: RuleCategory,
    fields: list[str],
    code: str,
    func: RuleFunc | None = None,
) -> Callable[[RuleFunc], RuleFunc] | RuleFunc:
    """Register a validation rule.

    Can be used as a decorator:
        @rule(RuleCategory.GEO, ["latitude"], "precision")
        def check_lat(data, ctx): ...

    Or as a direct call with a factory function:
        rule(RuleCategory.GEO, ["latitude"], "required", required("latitude", "..."))
    """

    def decorator(func: RuleFunc) -> RuleFunc:
        _RULES.append(Rule(func=func, category=category, fields=fields, code=code))
        return func

    if func is not None:
        decorator(func)
        return func
    return decorator


def all_rules() -> list[Rule]:
    return list(_RULES)


_Msg = str | dict[str, str]


def _resolve(msg: _Msg, ctx: RuleContext) -> str:
    if isinstance(msg, dict):
        return msg.get("en", msg["ru"]) if ctx.language == "en" else msg["ru"]
    return msg


def required(field: str, msg: _Msg) -> RuleFunc:
    """Check field is non-None and non-blank-string."""

    def rule(data: RecordData, ctx: RuleContext) -> str | None:
        v = getattr(data, field, None)
        m = _resolve(msg, ctx)
        return m if not v or (isinstance(v, str) and not v.strip()) else None

    return rule


def in_set(field: str, allowed: frozenset[str], msg: _Msg) -> RuleFunc:
    """Membership check; returns None if field is None (skips check)."""

    def rule(data: RecordData, ctx: RuleContext) -> str | None:
        v = getattr(data, field, None)
        m = _resolve(msg, ctx)
        return m if v is not None and v not in allowed else None

    return rule


def in_range(
    field: str,
    min_val: float | None,
    max_val: float | None,
    msg: _Msg,
    *,
    convert_to_float: bool = False,
) -> RuleFunc:
    """
    Min/max bounds check; if convert_to_float, tries string-to-float conversion first.
    """

    def rule(data: RecordData, ctx: RuleContext) -> str | None:
        v = getattr(data, field, None)
        m = _resolve(msg, ctx)
        if v is None:
            return None
        if convert_to_float and isinstance(v, str):
            try:
                v = float(v)
            except ValueError:
                return m
        if min_val is not None and v < min_val:
            return m
        if max_val is not None and v > max_val:
            return m
        return None

    return rule


def min_length(field: str, min_len: int, msg: _Msg) -> RuleFunc:
    """Strip string then check length >= min_len."""

    def rule(data: RecordData, ctx: RuleContext) -> str | None:
        v = getattr(data, field, None)
        m = _resolve(msg, ctx)
        if v is not None and len(v.strip()) < min_len:
            return m
        return None

    return rule
