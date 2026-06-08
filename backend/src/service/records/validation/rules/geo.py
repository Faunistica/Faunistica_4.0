from schema.records import RecordData
from service.geo import UralBorder

from ..constants import (
    COORD_PRECISION_MAX,
    COORD_PRECISION_MIN,
    COORD_UNCERTAINTY_MAX,
    COORD_UNCERTAINTY_MIN,
    GEOREF_SOURCES,
    REGION_LAT_MAX,
    REGION_LAT_MIN,
    REGION_LON_MAX,
    REGION_LON_MIN,
)
from ..helpers import decimal_places, should_skip_geo
from ..rules.base import RuleCategory, RuleContext, in_set, required, rule

@rule(RuleCategory.GEO, ["latitude"], "required")
def rule_latitude_required(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    v = data.latitude
    if v is None or (isinstance(v, str) and not v.strip()):
        return "Широта не задана"
    return None


@rule(RuleCategory.GEO, ["longitude"], "required")
def rule_longitude_required(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    v = data.longitude
    if v is None or (isinstance(v, str) and not v.strip()):
        return "Долгота не задана"
    return None
rule(
    RuleCategory.GEO,
    ["georef_source"],
    "required",
    required("georef_source", "Происхождение координат не указано"),
)


@rule(RuleCategory.GEO, ["latitude"], "precision")
def rule_latitude_precision(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    lat = data.latitude
    if lat is not None and decimal_places(lat) < COORD_PRECISION_MIN:
        return "Недостаточна точность широты"
    return None


@rule(RuleCategory.GEO, ["latitude"], "precision")
def rule_latitude_excess_precision(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    lat = data.latitude
    if lat is not None and decimal_places(lat) > COORD_PRECISION_MAX:
        return "Невозможно большая точность широты"
    return None


@rule(RuleCategory.GEO, ["longitude"], "precision")
def rule_longitude_precision(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    lon = data.longitude
    if lon is not None and decimal_places(lon) < COORD_PRECISION_MIN:
        return "Недостаточна точность долготы"
    return None


@rule(RuleCategory.GEO, ["longitude"], "precision")
def rule_longitude_excess_precision(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    lon = data.longitude
    if lon is not None and decimal_places(lon) > COORD_PRECISION_MAX:
        return "Невозможно большая точность долготы"
    return None


@rule(RuleCategory.GEO, ["coordinate_uncertainty"], "out_of_range")
def rule_coord_uncertainty_min(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    v = data.coordinate_uncertainty
    if v is not None and v < COORD_UNCERTAINTY_MIN:
        return "Радиус неточности координат недопустимо мал (менее 30 м)"
    return None


@rule(RuleCategory.GEO, ["coordinate_uncertainty"], "out_of_range")
def rule_coord_uncertainty_max(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    v = data.coordinate_uncertainty
    if v is not None and v > COORD_UNCERTAINTY_MAX:
        return "Радиус неточности координат недопустимо большой (более 15 км)"
    return None

rule(
    RuleCategory.GEO,
    ["georef_source"],
    "invalid",
    in_set(
        "georef_source",
        GEOREF_SOURCES,
        "Некорректный источник координат. Допустимые значения: "
        + ", ".join(GEOREF_SOURCES),
    ),
)

@rule(RuleCategory.GEO, ["latitude"], "out_of_range")
def rule_latitude_region(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    v = data.latitude
    if v is None:
        return None
    try:
        lat = float(v)
    except ValueError:
        return "Точка выходит за границы исследуемого региона по широте"
    if lat < REGION_LAT_MIN or lat > REGION_LAT_MAX:
        return "Точка выходит за границы исследуемого региона по широте"
    return None


@rule(RuleCategory.GEO, ["longitude"], "out_of_range")
def rule_longitude_region(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    v = data.longitude
    if v is None:
        return None
    try:
        lon = float(v)
    except ValueError:
        return "Точка выходит за границы исследуемого региона по долготе"
    if lon < REGION_LON_MIN or lon > REGION_LON_MAX:
        return "Точка выходит за границы исследуемого региона по долготе"
    return None


@rule(RuleCategory.GEO, ["latitude", "longitude"], "out_of_region")
def rule_ural_polygon_containment(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    lat_str = data.latitude
    lon_str = data.longitude
    if lat_str is None or lon_str is None:
        return None
    try:
        lat = float(lat_str)
        lon = float(lon_str)
    except ValueError:
        return None
    if not UralBorder.contains(lon, lat):
        return "Указанные координаты выходят за пределы Урала"
    return None


@rule(RuleCategory.GEO, ["georef_source"], "conflict")
def rule_geo_coords_conflict(data: RecordData, ctx: RuleContext) -> str | None:
    src = data.georef_source
    lat = data.latitude
    lon = data.longitude
    if (
        src is not None
        and src.strip().lower() == "none"
        and lat is not None
        and lat != "0"
        and lon is not None
        and lon != "0"
    ):
        return "Источник координат указан как 'none', но координаты присутствуют"
    return None
