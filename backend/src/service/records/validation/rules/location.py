from __future__ import annotations

from typing import TYPE_CHECKING

from ..helpers import contains_forbidden_chars, has_cyrillic_in_foreign_text
from ..rules.base import RuleCategory, min_length, rule

if TYPE_CHECKING:
    from schema.records import RecordData

    from ..rules.base import RuleContext


@rule(
    RuleCategory.LOCATION,
    ["country", "region", "district", "locality", "location_remarks"],
    "forbidden_chars",
)
def rule_forbidden_chars_location(data: RecordData, ctx: RuleContext) -> str | None:
    if contains_forbidden_chars(
        data.country,
        data.region,
        data.district,
        data.locality,
        data.location_remarks,
    ):
        return "Табуляция и/или переносы строки в разделе Административное расположение"
    return None


@rule(
    RuleCategory.LOCATION,
    ["country", "region", "district", "locality"],
    "cyrillic",
)
def rule_cyrillic_location(data: RecordData, ctx: RuleContext) -> str | None:
    if has_cyrillic_in_foreign_text(
        ctx.language,
        data.country,
        data.region,
        data.district,
        data.locality,
    ):
        return (
            "Кириллица в блоке Административное расположение "
            "для публикации не на русском языке"
        )
    return None


rule(
    RuleCategory.LOCATION,
    ["country"],
    "too_short",
    min_length("country", 4, "Страна указана некорректно"),
)
rule(
    RuleCategory.LOCATION,
    ["region"],
    "too_short",
    min_length("region", 5, "Регион указан некорректно"),
)
rule(
    RuleCategory.LOCATION,
    ["district"],
    "too_short",
    min_length("district", 5, "Район указан некорректно"),
)
