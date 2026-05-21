from schema.records import RecordData
from service.records.validation.errors import ErrorCollection
from service.records.validation.rules import RuleContext, all_rules


def validate_record(
    data: RecordData | None,
    *,
    language: str | None = None,
) -> ErrorCollection:
    errors = ErrorCollection()
    if data is None:
        errors.add([""], "EMPTY", "Пустая запись")
        return errors

    ctx = RuleContext(language=language)
    for rule in all_rules():
        msg = rule.func(data, ctx)
        if msg:
            errors.add(rule.fields, rule.code, msg, rule.category)
    return errors


__all__ = ["validate_record"]
