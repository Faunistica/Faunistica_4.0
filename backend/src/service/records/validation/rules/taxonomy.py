from schema.records import RecordData
from service.taxon import family_genus_known, genus_species_known

from ..constants import TAXON_RANKS, TYPE_STATUSES
from ..helpers import contains_forbidden_chars, has_cyrillic_in_foreign_text
from ..rules.base import RuleCategory, RuleContext, in_set, required, rule

rule(
    RuleCategory.TAXONOMY,
    ["family"],
    "required",
    required("family", "Семейство обязательно"),
)
rule(RuleCategory.TAXONOMY, ["genus"], "required", required("genus", "Род обязателен"))
rule(
    RuleCategory.TAXONOMY,
    ["species"],
    "required",
    required("species", "Вид обязателен"),
)


@rule(RuleCategory.TAXONOMY, ["genus"], "unknown")
def rule_family_genus_known(data: RecordData, ctx: RuleContext) -> str | None:
    if (
        data.tax_verbatim is not True
        and data.family is not None
        and data.genus is not None
        and not family_genus_known(data.family, data.genus)
    ):
        return "Неизвестная комбинация семейства и рода"
    return None


@rule(RuleCategory.TAXONOMY, ["species"], "unknown")
def rule_genus_species_known(data: RecordData, ctx: RuleContext) -> str | None:
    if (
        data.tax_verbatim is not True
        and data.genus is not None
        and data.species is not None
        and not genus_species_known(data.genus, data.species)
    ):
        return "Неизвестная комбинация рода и вида"
    return None


rule(
    RuleCategory.TAXONOMY,
    ["taxon_rank"],
    "invalid",
    in_set(
        "taxon_rank",
        TAXON_RANKS,
        "Некорректная точность названия таксона. "
        "Допустимые значения: " + ", ".join(TAXON_RANKS),
    ),
)
rule(
    RuleCategory.TAXONOMY,
    ["type_status"],
    "invalid",
    in_set("type_status", TYPE_STATUSES, "Некорректный тип статуса"),
)


@rule(RuleCategory.TAXONOMY, ["type_status"], "conflict")
def rule_type_status_on_genus(data: RecordData, ctx: RuleContext) -> str | None:
    if (
        data.type_status is not None
        and data.type_status != "none"
        and data.taxon_rank == "genus"
    ):
        return "Типовой статус не указывается для рода"
    return None


@rule(
    RuleCategory.TAXONOMY,
    [
        "family",
        "genus",
        "species",
        "accepted_name",
        "taxon_remarks",
        "identification_remarks",
    ],
    "forbidden_chars",
)
def rule_forbidden_chars_taxon(data: RecordData, ctx: RuleContext) -> str | None:
    if contains_forbidden_chars(
        data.family,
        data.genus,
        data.species,
        data.accepted_name,
        data.taxon_remarks,
        data.identification_remarks,
    ):
        return "Табуляция и/или переносы строки в разделе Таксономия"
    return None


@rule(
    RuleCategory.TAXONOMY,
    ["family", "genus", "species", "accepted_name", "identification_remarks"],
    "cyrillic",
)
def rule_cyrillic_taxon(data: RecordData, ctx: RuleContext) -> str | None:
    if has_cyrillic_in_foreign_text(
        ctx.language,
        data.family,
        data.genus,
        data.species,
        data.accepted_name,
        data.identification_remarks,
    ):
        return "Кириллица в блоке Таксономия для публикации не на русском языке"
    return None
