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


def required(field: str, msg: str) -> RuleFunc:
    """Check field is non-None and non-blank-string."""

    def rule(data: RecordData, _: RuleContext) -> str | None:
        v = getattr(data, field, None)
        return msg if not v or (isinstance(v, str) and not v.strip()) else None

    return rule


def in_set(field: str, allowed: frozenset[str], msg: str) -> RuleFunc:
    """Membership check; returns None if field is None (skips check)."""

    def rule(data: RecordData, _: RuleContext) -> str | None:
        v = getattr(data, field, None)
        return msg if v is not None and v not in allowed else None

    return rule


def in_range(
    field: str,
    min_val: float | None,
    max_val: float | None,
    msg: str,
    *,
    convert_to_float: bool = False,
) -> RuleFunc:
    """
    Min/max bounds check; if convert_to_float, tries string-to-float conversion first.
    """

    def rule(data: RecordData, _: RuleContext) -> str | None:
        v = getattr(data, field, None)
        if v is None:
            return None
        if convert_to_float and isinstance(v, str):
            try:
                v = float(v)
            except ValueError:
                return msg
        if min_val is not None and v < min_val:
            return msg
        if max_val is not None and v > max_val:
            return msg
        return None

    return rule


def min_length(field: str, min_len: int, msg: str) -> RuleFunc:
    """Strip string then check length >= min_len."""

    def rule(data: RecordData, _: RuleContext) -> str | None:
        v = getattr(data, field, None)
        if v is not None and len(v.strip()) < min_len:
            return msg
        return None

    return rule
