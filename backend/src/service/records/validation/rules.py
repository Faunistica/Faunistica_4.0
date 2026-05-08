from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

from schema.records import RecordData
from service.records.validation.errors import ErrorCollection

RuleFunc = Callable[[RecordData, ErrorCollection], None]


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
def rule_family_required(data: RecordData, errors: ErrorCollection) -> None:
    if not data.family:
        errors.add("family", "required", "Семейство обязательно")


@register("taxonomy", "genus_required")
def rule_genus_required(data: RecordData, errors: ErrorCollection) -> None:
    if not data.genus:
        errors.add("genus", "required", "Род обязателен")


@register("taxonomy", "species_required")
def rule_species_required(data: RecordData, errors: ErrorCollection) -> None:
    if not data.species:
        errors.add("species", "required", "Вид обязателен")


@register("location", "latitude_range")
def rule_latitude_range(data: RecordData, errors: ErrorCollection) -> None:
    lat = data.latitude
    if isinstance(lat, (int, float)) and (lat < -90 or lat > 90):
        errors.add("latitude", "out_of_range", "Широта должна быть от -90 до 90")


@register("location", "longitude_range")
def rule_longitude_range(data: RecordData, errors: ErrorCollection) -> None:
    lon = data.longitude
    if isinstance(lon, (int, float)) and (lon < -180 or lon > 180):
        errors.add("longitude", "out_of_range", "Долгота должна быть от -180 до 180")
