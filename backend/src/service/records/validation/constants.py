from pathlib import Path

from core.config import settings


def _load_short_countries(path: Path) -> frozenset[str]:
    try:
        with open(path) as f:
            return frozenset(line.strip() for line in f if line.strip())
    except FileNotFoundError:
        return frozenset()


SHORT_COUNTRY_ALLOWLIST: frozenset[str] = _load_short_countries(
    settings.SHORT_COUNTRIES_PATH
)

GEOREF_SOURCES: frozenset[str] = frozenset({"lit", "vol", "none"})

DATE_PRECISIONS: frozenset[str] = frozenset({"год", "месяц", "день"})

TAXON_RANKS: frozenset[str] = frozenset({"genus", "species", "subspecies"})

TYPE_STATUSES: frozenset[str] = frozenset(
    {
        "none",
        "голотип",
        "паратип",
        "неотип",
        "топотип",
        "синтип",
        "лектотип",
        "тип",
    }
)

QUANTITY_TYPES: frozenset[str] = frozenset(
    {
        "individuals",
        "individuals per 10 trap-days",
        "individuals per 100 trap-days",
        "individuals per 10 ditch-days",
        "individuals per 10 net sweps",
        "individuals per 100 net sweps",
        "individuals per 20 net sweppings",
        "individuals per 100 pitfall-traps",
        "individuals per m2",
        "Abundance class (Pesenko, 1982)",
    }
)

SEX_VALUES: frozenset[str] = frozenset({"none", "male", "female"})

CYRILLIC_LANGUAGES: frozenset[str] = frozenset({"rus", "ukr"})

# Numeric thresholds
REGION_LAT_MIN: float = 48.0
REGION_LAT_MAX: float = 75.0
REGION_LON_MIN: float = 51.0
REGION_LON_MAX: float = 75.0

COORD_UNCERTAINTY_MIN: float = 30.0
COORD_UNCERTAINTY_MAX: float = 15000.0

QUANTITY_MAX: float = 299.0

COORD_PRECISION_MIN: int = 2
COORD_PRECISION_MAX: int = 6
