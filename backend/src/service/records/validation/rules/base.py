from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from enum import StrEnum

from schema.records import RecordData


class RuleCategory(StrEnum):
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


def register(
    category: RuleCategory, fields: list[str], code: str
) -> Callable[[RuleFunc], RuleFunc]:
    def decorator(func: RuleFunc) -> RuleFunc:
        _RULES.append(Rule(func=func, category=category, fields=fields, code=code))
        return func

    return decorator


def all_rules() -> list[Rule]:
    return list(_RULES)


def required(field: str, msg: str) -> RuleFunc:
    def rule(data: RecordData, _: RuleContext) -> str | None:
        v = getattr(data, field, None)
        return msg if not v or (isinstance(v, str) and not v.strip()) else None

    return rule


def in_set(field: str, allowed: frozenset[str], msg: str) -> RuleFunc:
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
    def rule(data: RecordData, _: RuleContext) -> str | None:
        v = getattr(data, field, None)
        if v is not None and len(v.strip()) < min_len:
            return msg
        return None

    return rule
