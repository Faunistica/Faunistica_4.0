from schema.records import RecordData

from ..constants import QUANTITY_MAX, QUANTITY_TYPES
from ..helpers import contains_forbidden_chars
from ..rules.base import RuleCategory, RuleContext, in_set, rule


@rule(RuleCategory.ABUNDANCE, ["specimens"], "out_of_range")
def rule_total_quantity_max(data: RecordData, ctx: RuleContext) -> str | None:
    if data.specimens is None:
        return None
    total = sum(s.count for s in data.specimens)
    if total > QUANTITY_MAX:
        return (
            "Недопустимо большое число особей. "
            "Если их действительно 300 и более, то укажите 299, "
            "а реальное количество — в поле 'Примечания к экземпляру'."
        )
    return None


@rule(RuleCategory.ABUNDANCE, ["specimens"], "too_low")
def rule_each_count_min(data: RecordData, ctx: RuleContext) -> str | None:
    if data.specimens is None:
        return None
    for s in data.specimens:
        if s.count is not None and 0 < s.count < 0.001:
            return "Слишком мало особей"
    return None


@rule(RuleCategory.ABUNDANCE, ["specimens"], "count_negative")
def rule_each_count_positive(data: RecordData, ctx: RuleContext) -> str | None:
    if data.specimens is None:
        return None
    for s in data.specimens:
        if s.count < 0:
            return "Количество не может быть отрицательным"
    return None


rule(
    RuleCategory.ABUNDANCE,
    ["quantity_type"],
    "invalid",
    in_set(
        "quantity_type", QUANTITY_TYPES, "Некорректный тип единицы измерения обилия"
    ),
)


@rule(
    RuleCategory.ABUNDANCE,
    ["occurrence_remarks", "identification_remarks"],
    "forbidden_chars",
)
def rule_forbidden_chars_occurrence(data: RecordData, ctx: RuleContext) -> str | None:
    if contains_forbidden_chars(
        data.occurrence_remarks,
        data.identification_remarks,
    ):
        return "Табуляция и/или переносы строки в комментариях к экземпляру"
    return None
