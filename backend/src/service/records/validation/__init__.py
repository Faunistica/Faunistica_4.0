from __future__ import annotations

from typing import TYPE_CHECKING

from service.records.validation.errors import ErrorCollection
from service.records.validation.rules import RuleContext, all_rules

if TYPE_CHECKING:
    from schema.records import RecordData


def validate_record(
    data: RecordData | None,
    *,
    language: str | None = None,
) -> ErrorCollection:
    errors = ErrorCollection()
    if data is None:
        errors.add("", "EMPTY", "Пустая запись")
        return errors

    ctx = RuleContext(language=language)
    for rule in all_rules():
        rule.func(data, ctx, errors)
    return errors


__all__ = ["validate_record"]
