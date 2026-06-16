from schema.records import RecordData
from service.taxon import family_genus_known, genus_species_known

from ..constants import TAXON_RANKS, TYPE_STATUSES
from ..helpers import contains_forbidden_chars, has_cyrillic_in_foreign_text, nonblank
from ..rules.base import RuleCategory, RuleContext, in_set, required, rule

rule(
    RuleCategory.TAXONOMY,
    ["family"],
    "required",
    required("family", {"ru": "Семейство обязательно", "en": "Family is required"}),
)
rule(RuleCategory.TAXONOMY, ["genus"], "required", required("genus", {"ru": "Род обязателен", "en": "Genus is required"}))


@rule(RuleCategory.TAXONOMY, ["species"], "required")
def rule_species_required(data: RecordData, ctx: RuleContext) -> str | None:
    if data.tax_verbatim is True:
        return None
    v = data.species
    if not nonblank(v):
        return ctx.t("Вид обязателен", "Species is required")
    return None


@rule(RuleCategory.TAXONOMY, ["genus"], "unknown")
def rule_family_genus_known(data: RecordData, ctx: RuleContext) -> str | None:
    if (
        data.tax_verbatim is not True
        and nonblank(data.family)
        and nonblank(data.genus)
        and not family_genus_known(data.family, data.genus)
    ):
        return ctx.t("Неизвестная комбинация семейства и рода", "Unknown family-genus combination")
    return None


@rule(RuleCategory.TAXONOMY, ["species"], "unknown")
def rule_genus_species_known(data: RecordData, ctx: RuleContext) -> str | None:
    if (
        data.tax_verbatim is not True
        and nonblank(data.genus)
        and nonblank(data.species)
        and not genus_species_known(data.genus, data.species)
    ):
        return ctx.t("Неизвестная комбинация рода и вида", "Unknown genus-species combination")
    return None


rule(
    RuleCategory.TAXONOMY,
    ["taxon_rank"],
    "invalid",
    in_set(
        "taxon_rank",
        TAXON_RANKS,
        {
            "ru": "Некорректная точность названия таксона. "
            "Допустимые значения: " + ", ".join(TAXON_RANKS),
            "en": "Invalid taxon rank. "
            "Allowed values: " + ", ".join(TAXON_RANKS),
        },
    ),
)
rule(
    RuleCategory.TAXONOMY,
    ["type_status"],
    "invalid",
    in_set("type_status", TYPE_STATUSES, {"ru": "Некорректный тип статуса", "en": "Invalid type status"}),
)


@rule(RuleCategory.TAXONOMY, ["type_status"], "conflict")
def rule_type_status_on_genus(data: RecordData, ctx: RuleContext) -> str | None:
    if (
        data.type_status is not None
        and data.type_status != "none"
        and data.taxon_rank == "genus"
    ):
        return ctx.t("Типовой статус не указывается для рода", "Type status is not specified for genus")
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
        return ctx.t("Табуляция и/или переносы строки в разделе Таксономия", "Tabs and/or line breaks in the Taxonomy section")
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
        return ctx.t(
            "Кириллица в блоке Таксономия для публикации не на русском языке",
            "Cyrillic in Taxonomy block for non-Russian publication",
        )
    return None
