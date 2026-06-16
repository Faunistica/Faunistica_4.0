from schema.records import RecordData

from ..constants import QUANTITY_MAX
from ..helpers import contains_forbidden_chars
from ..rules.base import RuleCategory, RuleContext, rule


@rule(RuleCategory.ABUNDANCE, ["specimens"], "out_of_range")
def rule_total_quantity_max(data: RecordData, ctx: RuleContext) -> str | None:
    if data.specimens is None:
        return None
    total = sum(s.count for s in data.specimens)
    if total > QUANTITY_MAX:
        return ctx.t(
            "Недопустимо большое число особей. "
            "Если их действительно 300 и более, то укажите 299, "
            "а реальное количество — в поле 'Примечания к экземпляру'.",
            "Unacceptably large number of specimens. "
            "If there are really 300 or more, specify 299 "
            "and put the real count in the 'Specimen Notes' field.",
        )
    return None


@rule(RuleCategory.ABUNDANCE, ["specimens"], "too_low")
def rule_each_count_min(data: RecordData, ctx: RuleContext) -> str | None:
    if data.specimens is None:
        return None
    for s in data.specimens:
        if s.count is not None and 0 < s.count < 0.001:
            return ctx.t("Слишком мало особей", "Too few specimens")
    return None


@rule(RuleCategory.ABUNDANCE, ["specimens"], "count_negative")
def rule_each_count_positive(data: RecordData, ctx: RuleContext) -> str | None:
    if data.specimens is None:
        return None
    for s in data.specimens:
        if s.count < 0:
            return ctx.t("Количество не может быть отрицательным", "Count cannot be negative")
    return None


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
        return ctx.t("Табуляция и/или переносы строки в комментариях к экземпляру", "Tabs and/or line breaks in specimen comments")
    return None
