from schema.records import RecordData
from service.records.validation.rules.base import RuleCategory

from ..constants import LIFE_STAGES, QUANTITY_MAX, QUANTITY_TYPES, SEX_VALUES
from ..helpers import contains_forbidden_chars
from ..rules import RuleContext, in_range, in_set, register


@register(RuleCategory.ABUNDANCE, ["quantity"], "out_of_range")
def rule_quantity_max(data: RecordData, ctx: RuleContext) -> str | None:
    qty = data.quantity
    if qty is not None and qty > QUANTITY_MAX:
        return (
            "Недопустимо большое число особей. "
            "Если их действительно 300 и более, то укажите 299, "
            "а реальное количество — в поле 'Примечания к экземпляру'."
        )
    return None


register(RuleCategory.ABUNDANCE, ["quantity"], "too_low")(
    in_range("quantity", 0.001, None, "Слишком мало особей")
)
register(RuleCategory.ABUNDANCE, ["quantity_type"], "invalid")(
    in_set("quantity_type", QUANTITY_TYPES, "Некорректный тип единицы измерения обилия")
)
register(RuleCategory.ABUNDANCE, ["sex"], "invalid")(
    in_set(
        "sex",
        SEX_VALUES,
        "Некорректное значение пола. Допустимые значения: " + ", ".join(SEX_VALUES),
    )
)
register(RuleCategory.ABUNDANCE, ["life_stage"], "invalid")(
    in_set(
        "life_stage",
        LIFE_STAGES,
        "Некорректное значение стадии развития. Допустимые значения: "
        + ", ".join(LIFE_STAGES),
    )
)


@register(RuleCategory.ABUNDANCE, ["sex"], "inconsistent")
def rule_sex_lifestage_consistency(data: RecordData, ctx: RuleContext) -> str | None:
    if (
        data.sex is not None
        and data.sex != "none"
        and (data.life_stage is None or data.life_stage == "none")
    ):
        return "Если указываете пол, укажите и стадию развития"
    return None


@register(
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
