import csv
import logging
from pathlib import Path

from core.config import settings
from schema.taxonomy import AutofillTaxonResponse, TaxonomyField, TaxonomyFilters

logger = logging.getLogger(__name__)

# TODO: Replace local CSV with GBIF API integration for live taxonomy data
csv_path: Path = settings.SPECIES_CSV_PATH
if csv_path.exists():
    with csv_path.open(newline="") as f:
        _all_rows: list[dict[str, str]] = list(csv.DictReader(f))
else:
    logger.warning("Species CSV not found at %s", csv_path)
    _all_rows = []

FAMILY_GENUS_KNOWN: set[tuple[str, str]] = set()
GENUS_SPECIES_KNOWN: set[tuple[str, str]] = set()
for row in _all_rows:
    family = row.get("family")
    genus = row.get("genus")
    species = row.get("species")
    if family and genus:
        FAMILY_GENUS_KNOWN.add((family, genus))
    if genus and species:
        GENUS_SPECIES_KNOWN.add((genus, species))


def _filter_rows(
    rows: list[dict[str, str]], filters: TaxonomyFilters | None
) -> list[dict[str, str]]:
    if filters is None:
        return rows
    result = rows
    if filters.family is not None:
        result = [
            r
            for r in result
            if r.get("family") and filters.family.lower() in r["family"].lower()
        ]
    if filters.genus is not None:
        result = [
            r
            for r in result
            if r.get("genus") and filters.genus.lower() in r["genus"].lower()
        ]
    return result


def suggest(
    field: TaxonomyField, text: str, filters: TaxonomyFilters | None
) -> list[str]:
    rows = _filter_rows(_all_rows, filters)
    values = {
        r[field] for r in rows if r.get(field) and text.lower() in r[field].lower()
    }
    return sorted(values)


def autofill(field: TaxonomyField, text: str) -> AutofillTaxonResponse:
    if field == "family":
        return AutofillTaxonResponse(family=text, genus=None)

    for row in _all_rows:
        if row.get(field, "").lower() == text.lower():
            return AutofillTaxonResponse(
                family=row.get("family"), genus=row.get("genus")
            )
    return AutofillTaxonResponse(family=None, genus=None)


def family_genus_known(family: str, genus: str) -> bool:
    return (family, genus) in FAMILY_GENUS_KNOWN


def genus_species_known(genus: str, species: str) -> bool:
    return (genus, species) in GENUS_SPECIES_KNOWN
