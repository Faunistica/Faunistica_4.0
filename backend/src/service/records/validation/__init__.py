from __future__ import annotations

from typing import TYPE_CHECKING

from service.records.validation.errors import ErrorCollection
from service.records.validation.rules import all_rules

if TYPE_CHECKING:
    from schema.records import RecordData


def validate_record(data: RecordData) -> str | None:
    errors = ErrorCollection()
    for rule in all_rules():
        rule.func(data, errors)
    return errors.to_db_string()


__all__ = ["validate_record"]
