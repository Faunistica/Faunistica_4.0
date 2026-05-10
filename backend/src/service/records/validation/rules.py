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
    SHORT_COUNTRY_ALLOWLIST,
    TAXON_RANKS,
    TYPE_STATUSES,
)
from service.records.validation.errors import ErrorCollection
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


RuleFunc = Callable[[RecordData, RuleContext, ErrorCollection], None]


@dataclass(frozen=True)
class Rule:
    func: RuleFunc
    category: str
    name: str


_RULES: list[Rule] = []


def register(category: str, name: str) -> Callable[[RuleFunc], RuleFunc]:
    def decorator(func: RuleFunc) -> RuleFunc:
        _RULES.append(Rule(func=func, category=category, name=name))
        return func

    return decorator


def all_rules() -> list[Rule]:
    return list(_RULES)


@register("taxonomy", "family_required")
def rule_family_requir_(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if not data.family:
        errors.add("family", "required", "Семейство обязательно")


@register("taxonomy", "genus_required")
def rule_genus_required(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if not data.genus:
        errors.add("genus", "required", "Род обязателен")


@register("taxonomy", "species_required")
def rule_species_required(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if not data.species:
        errors.add("species", "required", "Вид обязателен")


@register("geo", "latitude_required")
def rule_latitude_required(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if should_skip_geo(data):
        return
    # TODO: 0,0 is a real location (Gulf of Guinea); consider dropping the == 0 check
    if data.latitude is None or data.latitude == 0:
        errors.add("latitude", "required", "Широта не задана")


@register("geo", "longitude_required")
def rule_longitude_required(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if should_skip_geo(data):
        return
    # TODO: 0,0 is a real location (Gulf of Guinea); consider dropping the == 0 check
    if data.longitude is None or data.longitude == 0:
        errors.add("longitude", "required", "Долгота не задана")


@register("geo", "latitude_precision")
def rule_latitude_precision(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if should_skip_geo(data):
        return
    lat = data.latitude
    if lat is not None and decimal_places(lat) < COORD_PRECISION_MIN:
        errors.add("latitude", "precision", "Недостаточна точность широты")


@register("geo", "latitude_excess_precision")
def rule_latitude_excess_precision(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if should_skip_geo(data):
        return
    lat = data.latitude
    if lat is not None and decimal_places(lat) > COORD_PRECISION_MAX:
        errors.add("latitude", "precision", "Невозможно большая точность широты")


@register("geo", "longitude_precision")
def rule_longitude_precision(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if should_skip_geo(data):
        return
    lon = data.longitude
    if lon is not None and decimal_places(lon) < COORD_PRECISION_MIN:
        errors.add("longitude", "precision", "Недостаточна точность долготы")


@register("geo", "longitude_excess_precision")
def rule_longitude_excess_precision(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if should_skip_geo(data):
        return
    lon = data.longitude
    if lon is not None and decimal_places(lon) > COORD_PRECISION_MAX:
        errors.add("longitude", "precision", "Невозможно большая точность долготы")


@register("geo", "coord_uncertainty_min")
def rule_coord_uncertainty_min(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if should_skip_geo(data):
        return
    unc = data.coordinate_uncertainty
    if unc is not None and unc < COORD_UNCERTAINTY_MIN:
        errors.add(
            "coordinate_uncertainty",
            "out_of_range",
            "Радиус неточности координат недопустимо мал (менее 30 м)",
        )


@register("geo", "coord_uncertainty_max")
def rule_coord_uncertainty_max(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if should_skip_geo(data):
        return
    unc = data.coordinate_uncertainty
    if unc is not None and unc > COORD_UNCERTAINTY_MAX:
        errors.add(
            "coordinate_uncertainty",
            "out_of_range",
            "Радиус неточности координат недопустимо большой (более 15 км)",
        )


@register("geo", "georef_source_required")
def rule_georef_source_required(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if should_skip_geo(data):
        return
    src = data.georef_source
    if src is None or src.strip() == "":
        errors.add("georef_source", "required", "Происхождение координат не указано")


@register("geo", "georef_source_valid")
def rule_georef_source_valid(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if should_skip_geo(data):
        return
    src = data.georef_source
    if src is not None and src not in GEOREF_SOURCES:
        errors.add(
            "georef_source",
            "invalid",
            "Некорректный источник координат. Допустимые значения: lit, vol, none",
        )


@register("geo", "region_bounds_lat")
def rule_region_bounds_lat(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if should_skip_geo(data):
        return
    lat = data.latitude
    if lat is not None and (lat < REGION_LAT_MIN or lat > REGION_LAT_MAX):
        errors.add(
            "latitude",
            "out_of_range",
            "Точка выходит за границы исследуемого региона по широте",
        )


@register("geo", "region_bounds_lon")
def rule_region_bounds_lon(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if should_skip_geo(data):
        return
    lon = data.longitude
    if lon is not None and (lon < REGION_LON_MIN or lon > REGION_LON_MAX):
        errors.add(
            "longitude",
            "out_of_range",
            "Точка выходит за границы исследуемого региона по долготе",
        )


@register("geo", "ural_polygon_containment")
def rule_ural_polygon_containment(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if should_skip_geo(data):
        return
    lat = data.latitude
    lon = data.longitude
    if lat is None or lon is None:
        return
    if lat < 48 or lat > 75 or lon < 51 or lon > 75:
        return
    if not UralPolygon.contains(lon, lat):
        errors.add(
            "coordinates",
            "out_of_region",
            "Указанные координаты выходят за пределы Урала",
        )


@register("geo", "geo_coords_conflict")
def rule_geo_coords_conflict(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
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
        errors.add(
            "georef_source",
            "conflict",
            "Источник координат указан как 'none', но координаты присутствуют",
        )


@register("location", "forbidden_chars_location")
def rule_forbidden_chars_location(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if contains_forbidden_chars(
        data.country,
        data.region,
        data.district,
        data.locality,
        data.location_remarks,
    ):
        errors.add(
            "location",
            "forbidden_chars",
            "Табуляция и/или переносы строки в разделе Административное расположение",
        )


@register("location", "cyrillic_location")
def rule_cyrillic_location(
    data: RecordData, ctx: RuleContext, errors: ErrorCollection
) -> None:
    if has_cyrillic_in_foreign_text(
        ctx.language,
        data.country,
        data.region,
        data.district,
        data.locality,
    ):
        errors.add(
            "location",
            "cyrillic",
            "Кириллица в блоке Административное расположение "
            "для публикации не на русском языке",
        )


@register("location", "country_min_length")
def rule_country_min_length(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    country = data.country
    if (
        country is not None
        and country not in SHORT_COUNTRY_ALLOWLIST
        and len(country.strip()) < 4
    ):
        errors.add("country", "too_short", "Страна указана некорректно")


@register("location", "region_min_length")
def rule_region_min_length(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    region = data.region
    if region is not None and len(region.strip()) < 5:
        errors.add("region", "too_short", "Регион указан некорректно")


@register("location", "district_min_length")
def rule_district_min_length(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    district = data.district
    if district is not None and len(district.strip()) < 5:
        errors.add("district", "too_short", "Район указан некорректно")


@register("event", "date_not_empty")
def rule_date_not_empty(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if data.verbatim_date is None or data.verbatim_date.strip() == "":
        errors.add("verbatim_date", "required", "Дата сбора не указана")


@register("event", "date_precision_valid")
def rule_date_precision_valid(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    prec = data.date_precision
    if prec is not None and prec not in DATE_PRECISIONS:
        errors.add(
            "date_precision",
            "invalid",
            "Некорректная точность указания даты. "
            "Допустимые значения: год, месяц, день",
        )


@register("event", "interval_no_separator")
def rule_interval_no_separator(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if (
        data.is_interval is True
        and data.verbatim_date is not None
        and not has_range_separator(data.verbatim_date)
    ):
        errors.add(
            "verbatim_date",
            "conflict",
            "Указан интервал дат, но значение не содержит разделителя интервала",
        )


@register("event", "date_precision_no_date")
def rule_date_precision_no_date(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if data.date_precision is not None and (
        data.verbatim_date is None or data.verbatim_date.strip() == ""
    ):
        errors.add(
            "date_precision",
            "conflict",
            "Указана точность даты, но дата не заполнена",
        )


@register("event", "recorded_by_required")
def rule_recorded_by_required(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    rb = data.recorded_by
    if rb is None or rb.strip() == "" or len(rb.strip()) < 4:
        errors.add(
            "recorded_by",
            "required",
            "Коллектор не распознан. Обратите внимание на аббревиатуры. "
            "Если не указано, поставьте автора публикации.",
        )


@register("event", "forbidden_chars_event")
def rule_forbidden_chars_event(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
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
        errors.add(
            "event",
            "forbidden_chars",
            "Табуляция и/или переносы строки в разделе Сбор материала",
        )


@register("event", "cyrillic_event")
def rule_cyrillic_event(
    data: RecordData, ctx: RuleContext, errors: ErrorCollection
) -> None:
    if has_cyrillic_in_foreign_text(
        ctx.language,
        data.habitat,
        data.sampling_protocol,
        data.sampling_effort,
        data.sample_size_unit,
        data.recorded_by,
    ):
        errors.add(
            "event",
            "cyrillic",
            "Кириллица в блоке Сбор материала для публикации не на русском языке",
        )


@register("taxonomy", "family_genus_known")
def rule_family_genus_known(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if (
        data.tax_verbatim is not True
        and data.family is not None
        and data.genus is not None
        and not family_genus_known(data.family, data.genus)
    ):
        errors.add("genus", "unknown", "Неизвестная комбинация семейства и рода")


@register("taxonomy", "genus_species_known")
def rule_genus_species_known(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if (
        data.tax_verbatim is not True
        and data.genus is not None
        and data.species is not None
        and not genus_species_known(data.genus, data.species)
    ):
        errors.add("species", "unknown", "Неизвестная комбинация рода и вида")


@register("taxonomy", "taxon_rank_valid")
def rule_taxon_rank_valid(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    rank = data.taxon_rank
    if rank is not None and rank not in TAXON_RANKS:
        errors.add(
            "taxon_rank",
            "invalid",
            "Некорректная точность названия таксона. "
            "Допустимые значения: genus, species, subspecies",
        )


@register("taxonomy", "type_status_valid")
def rule_type_status_valid(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    ts = data.type_status
    if ts is not None and ts not in TYPE_STATUSES:
        errors.add("type_status", "invalid", "Некорректный тип статуса")


@register("taxonomy", "type_status_on_genus")
def rule_type_status_on_genus(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if (
        data.type_status is not None
        and data.type_status != "none"
        and data.taxon_rank == "genus"
    ):
        errors.add("type_status", "conflict", "Типовой статус не указывается для рода")


@register("taxonomy", "forbidden_chars_taxon")
def rule_forbidden_chars_taxon(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if contains_forbidden_chars(
        data.family,
        data.genus,
        data.species,
        data.accepted_name,
        data.taxon_remarks,
        data.identification_remarks,
    ):
        errors.add(
            "taxonomy",
            "forbidden_chars",
            "Табуляция и/или переносы строки в разделе Таксономия",
        )


@register("taxonomy", "cyrillic_taxon")
def rule_cyrillic_taxon(
    data: RecordData, ctx: RuleContext, errors: ErrorCollection
) -> None:
    if has_cyrillic_in_foreign_text(
        ctx.language,
        data.family,
        data.genus,
        data.species,
        data.accepted_name,
        data.identification_remarks,
    ):
        errors.add(
            "taxonomy",
            "cyrillic",
            "Кириллица в блоке Таксономия для публикации не на русском языке",
        )


@register("abundance", "quantity_max")
def rule_quantity_max(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    qty = data.quantity
    if qty is not None and qty > QUANTITY_MAX:
        errors.add(
            "quantity",
            "out_of_range",
            "Недопустимо большое число особей. "
            "Если их действительно 300 и более, то укажите 299, "
            "а реальное количество — в поле 'примечания к экземпляру'.",
        )


@register("abundance", "total_quantity_positive")
def rule_total_quantity_positive(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    qty = data.quantity
    if qty is None or qty <= 0:
        errors.add("quantity", "too_low", "Слишком мало особей")


@register("abundance", "quantity_type_valid")
def rule_quantity_type_valid(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    qt = data.quantity_type
    if qt is not None and qt not in QUANTITY_TYPES:
        errors.add(
            "quantity_type",
            "invalid",
            "Некорректный тип единицы измерения обилия",
        )


@register("abundance", "sex_valid")
def rule_sex_valid(data: RecordData, _: RuleContext, errors: ErrorCollection) -> None:
    sex = data.sex
    if sex is not None and sex not in SEX_VALUES:
        errors.add(
            "sex",
            "invalid",
            "Некорректное значение пола. Допустимые значения: none, male, female",
        )


@register("abundance", "life_stage_valid")
def rule_life_stage_valid(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    ls = data.life_stage
    if ls is not None and ls not in LIFE_STAGES:
        errors.add(
            "life_stage",
            "invalid",
            "Некорректное значение стадии развития. "
            "Допустимые значения: none, взрослые, субвзрослые, ювенильные",
        )


@register("abundance", "sex_lifestage_consistency")
def rule_sex_lifestage_consistency(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if (
        data.sex is not None
        and data.sex != "none"
        and (data.life_stage is None or data.life_stage == "none")
    ):
        errors.add(
            "sex",
            "inconsistent",
            "Если указываете пол, укажите и стадию развития",
        )


@register("abundance", "forbidden_chars_occurrence")
def rule_forbidden_chars_occurrence(
    data: RecordData, _: RuleContext, errors: ErrorCollection
) -> None:
    if contains_forbidden_chars(
        data.occurrence_remarks,
        data.identification_remarks,
    ):
        errors.add(
            "occurrence",
            "forbidden_chars",
            "Табуляция и/или переносы строки в комментариях к экземпляру",
        )
