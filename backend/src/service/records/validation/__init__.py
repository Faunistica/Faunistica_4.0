from __future__ import annotations

from typing import TYPE_CHECKING

from service.records.validation.errors import ErrorCollection
from service.records.validation.rules import _RULE_CONTEXT, all_rules

if TYPE_CHECKING:
    from schema.records import RecordData


def validate_record(
    data: RecordData | None,
    *,
    language: str | None = None,
) -> str | None:
    if data is None:
        return "Пустая запись"
    errors = ErrorCollection()
    token = _RULE_CONTEXT.set({"language": language})
    try:
        for rule in all_rules():
            rule.func(data, errors)
        return errors.to_db_string()
    finally:
        _RULE_CONTEXT.reset(token)


__all__ = ["validate_record"]
