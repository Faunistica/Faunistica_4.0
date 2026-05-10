from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

from schema.records import RecordData
from service.geo import UralPolygon
from service.records.validation.constants import (
    COORD_PRECISION_MAX,
    COORD_PRECISION_MIN,
    COORD_UNCERTAINTY_MAX,
    COORD_UNCERTAINTY_MIN,
    DATE_PRECISIONS,
    GEOREF_SOURCES,
    LIFE_STAGES,
    QUANTITY_MAX,
    QUANTITY_TYPES,
    REGION_LAT_MAX,
    REGION_LAT_MIN,
    REGION_LON_MAX,
    REGION_LON_MIN,
    SEX_VALUES,
    TAXON_RANKS,
    TYPE_STATUSES,
)
from service.records.validation.helpers import (
    contains_forbidden_chars,
    decimal_places,
    has_cyrillic_in_foreign_text,
    has_range_separator,
    should_skip_geo,
)
from service.taxon import family_genus_known, genus_species_known


@dataclass
class RuleContext:
    language: str | None = None


RuleFunc = Callable[[RecordData, RuleContext], str | None]


@dataclass(frozen=True)
class Rule:
    func: RuleFunc
    category: str
    fields: list[str]
    code: str


_RULES: list[Rule] = []


def register(
    category: str, fields: list[str], code: str
) -> Callable[[RuleFunc], RuleFunc]:
    def decorator(func: RuleFunc) -> RuleFunc:
        _RULES.append(Rule(func=func, category=category, fields=fields, code=code))
        return func

    return decorator


def all_rules() -> list[Rule]:
    return list(_RULES)


def required(field: str, msg: str) -> RuleFunc:
    def rule(data: RecordData, _: RuleContext) -> str | None:
        v = getattr(data, field, None)
        return msg if not v or (isinstance(v, str) and not v.strip()) else None

    return rule


def in_set(field: str, allowed: frozenset[str], msg: str) -> RuleFunc:
    def rule(data: RecordData, _: RuleContext) -> str | None:
        v = getattr(data, field, None)
        return msg if v is not None and v not in allowed else None

    return rule


def in_range(
    field: str, min_val: float | None, max_val: float | None, msg: str
) -> RuleFunc:
    def rule(data: RecordData, _: RuleContext) -> str | None:
        v = getattr(data, field, None)
        if v is None:
            return None
        if min_val is not None and v < min_val:
            return msg
        if max_val is not None and v > max_val:
            return msg
        return None

    return rule


def min_length(field: str, min_len: int, msg: str) -> RuleFunc:
    def rule(data: RecordData, _: RuleContext) -> str | None:
        v = getattr(data, field, None)
        if v is not None and len(v.strip()) < min_len:
            return msg
        return None

    return rule


register("taxonomy", ["family"], "required")(
    required("family", "Семейство обязательно")
)
register("taxonomy", ["genus"], "required")(required("genus", "Род обязателен"))
register("taxonomy", ["species"], "required")(required("species", "Вид обязателен"))

register("geo", ["latitude"], "required")(required("latitude", "Широта не задана"))
register("geo", ["longitude"], "required")(required("longitude", "Долгота не задана"))
register("geo", ["georef_source"], "required")(
    required("georef_source", "Происхождение координат не указано")
)

register("geo", ["latitude"], "precision")(
    required("latitude", "Недостаточна точность широты")
)


@register("geo", ["latitude"], "precision")
def rule_latitude_precision(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    lat = data.latitude
    if lat is not None and decimal_places(lat) < COORD_PRECISION_MIN:
        return "Недостаточна точность широты"
    return None


@register("geo", ["latitude"], "precision")
def rule_latitude_excess_precision(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    lat = data.latitude
    if lat is not None and decimal_places(lat) > COORD_PRECISION_MAX:
        return "Невозможно большая точность широты"
    return None


@register("geo", ["longitude"], "precision")
def rule_longitude_precision(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    lon = data.longitude
    if lon is not None and decimal_places(lon) < COORD_PRECISION_MIN:
        return "Недостаточна точность долготы"
    return None


@register("geo", ["longitude"], "precision")
def rule_longitude_excess_precision(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    lon = data.longitude
    if lon is not None and decimal_places(lon) > COORD_PRECISION_MAX:
        return "Невозможно большая точность долготы"
    return None


register("geo", ["coordinate_uncertainty"], "out_of_range")(
    in_range(
        "coordinate_uncertainty",
        COORD_UNCERTAINTY_MIN,
        None,
        "Радиус неточности координат недопустимо мал (менее 30 м)",
    )
)
register("geo", ["coordinate_uncertainty"], "out_of_range")(
    in_range(
        "coordinate_uncertainty",
        None,
        COORD_UNCERTAINTY_MAX,
        "Радиус неточности координат недопустимо большой (более 15 км)",
    )
)

register("geo", ["georef_source"], "invalid")(
    in_set(
        "georef_source",
        GEOREF_SOURCES,
        "Некорректный источник координат. Допустимые значения: lit, vol, none",
    )
)

register("geo", ["latitude"], "out_of_range")(
    in_range(
        "latitude",
        REGION_LAT_MIN,
        REGION_LAT_MAX,
        "Точка выходит за границы исследуемого региона по широте",
    )
)
register("geo", ["longitude"], "out_of_range")(
    in_range(
        "longitude",
        REGION_LON_MIN,
        REGION_LON_MAX,
        "Точка выходит за границы исследуемого региона по долготе",
    )
)


@register("geo", ["latitude", "longitude"], "out_of_region")
def rule_ural_polygon_containment(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    lat = data.latitude
    lon = data.longitude
    if lat is None or lon is None:
        return None
    if lat < 48 or lat > 75 or lon < 51 or lon > 75:
        return None
    if not UralPolygon.contains(lon, lat):
        return "Указанные координаты выходят за пределы Урала"
    return None


@register("geo", ["georef_source"], "conflict")
def rule_geo_coords_conflict(data: RecordData, ctx: RuleContext) -> str | None:
    src = data.georef_source
    lat = data.latitude
    lon = data.longitude
    if (
        src is not None
        and src.strip().lower() == "none"
        and lat is not None
        and lat != 0
        and lon is not None
        and lon != 0
    ):
        return "Источник координат указан как 'none', но координаты присутствуют"
    return None


@register(
    "location",
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


@register("location", ["country", "region", "district", "locality"], "cyrillic")
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


register("location", ["country"], "too_short")(
    min_length("country", 4, "Страна указана некорректно")
)
register("location", ["region"], "too_short")(
    min_length("region", 5, "Регион указан некорректно")
)
register("location", ["district"], "too_short")(
    min_length("district", 5, "Район указан некорректно")
)


register("event", ["verbatim_date"], "required")(
    required("verbatim_date", "Дата сбора не указана")
)
register("event", ["date_precision"], "invalid")(
    in_set(
        "date_precision",
        DATE_PRECISIONS,
        "Некорректная точность указания даты. Допустимые значения: год, месяц, день",
    )
)


@register("event", ["verbatim_date"], "conflict")
def rule_interval_no_separator(data: RecordData, ctx: RuleContext) -> str | None:
    if (
        data.is_interval is True
        and data.verbatim_date is not None
        and not has_range_separator(data.verbatim_date)
    ):
        return "Указан интервал дат, но значение не содержит разделителя интервала"
    return None


@register("event", ["date_precision"], "conflict")
def rule_date_precision_no_date(data: RecordData, ctx: RuleContext) -> str | None:
    if data.date_precision is not None and (
        data.verbatim_date is None or data.verbatim_date.strip() == ""
    ):
        return "Указана точность даты, но дата не заполнена"
    return None


@register("event", ["recorded_by"], "required")
def rule_recorded_by_required(data: RecordData, ctx: RuleContext) -> str | None:
    rb = data.recorded_by
    if rb is None or rb.strip() == "" or len(rb.strip()) < 4:
        return (
            "Коллектор не распознан. Обратите внимание на аббревиатуры. "
            "Если не указано, поставьте автора публикации."
        )
    return None


@register(
    "event",
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


@register(
    "event",
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


@register("taxonomy", ["genus"], "unknown")
def rule_family_genus_known(data: RecordData, ctx: RuleContext) -> str | None:
    if (
        data.tax_verbatim is not True
        and data.family is not None
        and data.genus is not None
        and not family_genus_known(data.family, data.genus)
    ):
        return "Неизвестная комбинация семейства и рода"
    return None


@register("taxonomy", ["species"], "unknown")
def rule_genus_species_known(data: RecordData, ctx: RuleContext) -> str | None:
    if (
        data.tax_verbatim is not True
        and data.genus is not None
        and data.species is not None
        and not genus_species_known(data.genus, data.species)
    ):
        return "Неизвестная комбинация рода и вида"
    return None


register("taxonomy", ["taxon_rank"], "invalid")(
    in_set(
        "taxon_rank",
        TAXON_RANKS,
        (
            "Некорректная точность названия таксона. "
            "Допустимые значения: genus, species, subspecies"
        ),
    )
)
register("taxonomy", ["type_status"], "invalid")(
    in_set("type_status", TYPE_STATUSES, "Некорректный тип статуса")
)


@register("taxonomy", ["type_status"], "conflict")
def rule_type_status_on_genus(data: RecordData, ctx: RuleContext) -> str | None:
    if (
        data.type_status is not None
        and data.type_status != "none"
        and data.taxon_rank == "genus"
    ):
        return "Типовой статус не указывается для рода"
    return None


@register(
    "taxonomy",
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


@register(
    "taxonomy",
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


@register("abundance", ["quantity"], "out_of_range")
def rule_quantity_max(data: RecordData, ctx: RuleContext) -> str | None:
    qty = data.quantity
    if qty is not None and qty > QUANTITY_MAX:
        return (
            "Недопустимо большое число особей. "
            "Если их действительно 300 и более, то укажите 299, "
            "а реальное количество — в поле 'Примечания к экземпляру'."
        )
    return None


register("abundance", ["quantity"], "too_low")(
    in_range("quantity", 0.001, None, "Слишком мало особей")
)
register("abundance", ["quantity_type"], "invalid")(
    in_set("quantity_type", QUANTITY_TYPES, "Некорректный тип единицы измерения обилия")
)
register("abundance", ["sex"], "invalid")(
    in_set(
        "sex",
        SEX_VALUES,
        "Некорректное значение пола. Допустимые значения: none, male, female",
    )
)
register("abundance", ["life_stage"], "invalid")(
    in_set(
        "life_stage",
        LIFE_STAGES,
        (
            "Некорректное значение стадии развития. "
            "Допустимые значения: none, взрослые, субвзрослые, ювенильные"
        ),
    )
)


@register("abundance", ["sex"], "inconsistent")
def rule_sex_lifestage_consistency(data: RecordData, ctx: RuleContext) -> str | None:
    if (
        data.sex is not None
        and data.sex != "none"
        and (data.life_stage is None or data.life_stage == "none")
    ):
        return "Если указываете пол, укажите и стадию развития"
    return None


@register(
    "abundance", ["occurrence_remarks", "identification_remarks"], "forbidden_chars"
)
def rule_forbidden_chars_occurrence(data: RecordData, ctx: RuleContext) -> str | None:
    if contains_forbidden_chars(
        data.occurrence_remarks,
        data.identification_remarks,
    ):
        return "Табуляция и/или переносы строки в комментариях к экземпляру"
    return None
