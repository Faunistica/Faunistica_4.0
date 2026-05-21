from schema.records import RecordData

from ..constants import DATE_PRECISIONS
from ..helpers import (
    contains_forbidden_chars,
    has_cyrillic_in_foreign_text,
    has_range_separator,
)
from ..rules.base import RuleCategory, RuleContext, in_set, required, rule

rule(
    RuleCategory.EVENT,
    ["verbatim_date"],
    "required",
    required("verbatim_date", "Дата сбора не указана"),
)
rule(
    RuleCategory.EVENT,
    ["date_precision"],
    "invalid",
    in_set(
        "date_precision",
        DATE_PRECISIONS,
        "Некорректная точность указания даты. Допустимые значения: "
        + ", ".join(DATE_PRECISIONS),
    ),
)


@rule(RuleCategory.EVENT, ["verbatim_date"], "conflict")
def rule_interval_no_separator(data: RecordData, ctx: RuleContext) -> str | None:
    if (
        data.is_interval is True
        and data.verbatim_date is not None
        and not has_range_separator(data.verbatim_date)
    ):
        return "Указан интервал дат, но значение не содержит разделителя интервала"
    return None


@rule(RuleCategory.EVENT, ["date_precision"], "conflict")
def rule_date_precision_no_date(data: RecordData, ctx: RuleContext) -> str | None:
    if data.date_precision is not None and (
        data.verbatim_date is None or data.verbatim_date.strip() == ""
    ):
        return "Указана точность даты, но дата не заполнена"
    return None


@rule(RuleCategory.EVENT, ["recorded_by"], "required")
def rule_recorded_by_required(data: RecordData, ctx: RuleContext) -> str | None:
    rb = data.recorded_by
    if rb is None or rb.strip() == "" or len(rb.strip()) < 4:
        return (
            "Коллектор не распознан. Обратите внимание на аббревиатуры. "
            "Если не указано, поставьте автора публикации."
        )
    return None


@rule(
    RuleCategory.EVENT,
    [
        "habitat",
        "sampling_protocol",
        "sampling_effort",
        "sample_size_unit",
        "event_remarks",
        "recorded_by",
    ],
    "forbidden_chars",
)
def rule_forbidden_chars_event(data: RecordData, ctx: RuleContext) -> str | None:
    sv = str(data.sample_size_value) if data.sample_size_value is not None else None
    if contains_forbidden_chars(
        data.habitat,
        data.sampling_protocol,
        data.sampling_effort,
        sv,
        data.sample_size_unit,
        data.event_remarks,
        data.recorded_by,
    ):
        return "Табуляция и/или переносы строки в разделе Сбор материала"
    return None


@rule(
    RuleCategory.EVENT,
    [
        "habitat",
        "sampling_protocol",
        "sampling_effort",
        "sample_size_unit",
        "recorded_by",
    ],
    "cyrillic",
)
def rule_cyrillic_event(data: RecordData, ctx: RuleContext) -> str | None:
    if has_cyrillic_in_foreign_text(
        ctx.language,
        data.habitat,
        data.sampling_protocol,
        data.sampling_effort,
        data.sample_size_unit,
        data.recorded_by,
    ):
        return "Кириллица в блоке Сбор материала для публикации не на русском языке"
    return None


@rule(RuleCategory.EVENT, ["sample_size_value"], "out_of_range")
def rule_sample_size_positive(data: RecordData, ctx: RuleContext) -> str | None:
    v = data.sample_size_value
    if v is not None and v <= 0:
        return "Объём выборки должен быть положительным числом"
    return None
