from __future__ import annotations

from typing import TYPE_CHECKING

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
from ..rules import RuleCategory, in_range, in_set, register, required

if TYPE_CHECKING:
    from schema.records import RecordData

    from ..rules import RuleContext

register(RuleCategory.GEO, ["latitude"], "required")(
    required("latitude", "Широта не задана")
)
register(RuleCategory.GEO, ["longitude"], "required")(
    required("longitude", "Долгота не задана")
)
register(RuleCategory.GEO, ["georef_source"], "required")(
    required("georef_source", "Происхождение координат не указано")
)

register(RuleCategory.GEO, ["latitude"], "precision")(
    required("latitude", "Недостаточна точность широты")
)


@register(RuleCategory.GEO, ["latitude"], "precision")
def rule_latitude_precision(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    lat = data.latitude
    if lat is not None and decimal_places(lat) < COORD_PRECISION_MIN:
        return "Недостаточна точность широты"
    return None


@register(RuleCategory.GEO, ["latitude"], "precision")
def rule_latitude_excess_precision(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    lat = data.latitude
    if lat is not None and decimal_places(lat) > COORD_PRECISION_MAX:
        return "Невозможно большая точность широты"
    return None


@register(RuleCategory.GEO, ["longitude"], "precision")
def rule_longitude_precision(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    lon = data.longitude
    if lon is not None and decimal_places(lon) < COORD_PRECISION_MIN:
        return "Недостаточна точность долготы"
    return None


@register(RuleCategory.GEO, ["longitude"], "precision")
def rule_longitude_excess_precision(data: RecordData, ctx: RuleContext) -> str | None:
    if should_skip_geo(data):
        return None
    lon = data.longitude
    if lon is not None and decimal_places(lon) > COORD_PRECISION_MAX:
        return "Невозможно большая точность долготы"
    return None


register(RuleCategory.GEO, ["coordinate_uncertainty"], "out_of_range")(
    in_range(
        "coordinate_uncertainty",
        COORD_UNCERTAINTY_MIN,
        None,
        "Радиус неточности координат недопустимо мал (менее 30 м)",
    )
)
register(RuleCategory.GEO, ["coordinate_uncertainty"], "out_of_range")(
    in_range(
        "coordinate_uncertainty",
        None,
        COORD_UNCERTAINTY_MAX,
        "Радиус неточности координат недопустимо большой (более 15 км)",
    )
)

register(RuleCategory.GEO, ["georef_source"], "invalid")(
    in_set(
        "georef_source",
        GEOREF_SOURCES,
        "Некорректный источник координат. Допустимые значения: "
        + ", ".join(GEOREF_SOURCES),
    )
)

register(RuleCategory.GEO, ["latitude"], "out_of_range")(
    in_range(
        "latitude",
        REGION_LAT_MIN,
        REGION_LAT_MAX,
        "Точка выходит за границы исследуемого региона по широте",
        convert_to_float=True,
    )
)
register(RuleCategory.GEO, ["longitude"], "out_of_range")(
    in_range(
        "longitude",
        REGION_LON_MIN,
        REGION_LON_MAX,
        "Точка выходит за границы исследуемого региона по долготе",
        convert_to_float=True,
    )
)


@register(RuleCategory.GEO, ["latitude", "longitude"], "out_of_region")
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


@register(RuleCategory.GEO, ["georef_source"], "conflict")
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
