import logging

import pandas as pd

from core.config import settings
from schema.taxonomy import AutofillTaxonResponse, TaxonomyField, TaxonomyFilters

logger = logging.getLogger(__name__)

# TODO: Replace local CSV with GBIF API integration for live taxonomy data
csv_path = settings.SPECIES_CSV_PATH
df = pd.read_csv(csv_path, usecols=["family", "genus", "species"])

FAMILY_GENUS_KNOWN: set[tuple[str, str]] = set(
    df[["family", "genus"]].drop_duplicates().itertuples(index=False, name=None)
)
GENUS_SPECIES_KNOWN: set[tuple[str, str]] = set(
    df[["genus", "species"]]
    .dropna()
    .drop_duplicates()
    .itertuples(index=False, name=None)
)


def suggest(
    field: TaxonomyField, text: str, filters: TaxonomyFilters | None
) -> list[str]:
    query_df = df.copy()

    if filters is not None and filters.family is not None:
        query_df = query_df[
            query_df["family"].str.contains(filters.family, case=False, na=False)
        ]

    if filters is not None and filters.genus is not None:
        query_df = query_df[
            query_df["genus"].str.contains(filters.genus, case=False, na=False)
        ]

    suggestions = query_df[field]

    filtered = (
        suggestions[suggestions.str.contains(text, case=False, na=False)]
        .dropna()
        .drop_duplicates()
        .sort_values()
    )

    return filtered.tolist()


def autofill(field: TaxonomyField, text: str) -> AutofillTaxonResponse:
    if field == "family":
        return AutofillTaxonResponse(family=text, genus=None)

    query_df = df.copy()
    match_df = query_df[query_df[field].str.lower() == text.lower()]

    if match_df.empty:
        return AutofillTaxonResponse(family=None, genus=None)

    row = match_df.iloc[0]

    return AutofillTaxonResponse(family=row["family"], genus=row["genus"])


def family_genus_known(family: str, genus: str) -> bool:
    """Check if (family, genus) pair exists in WSC reference."""
    return (family, genus) in FAMILY_GENUS_KNOWN


def genus_species_known(genus: str, species: str) -> bool:
    """Check if (genus, species) pair exists in WSC reference."""
    return (genus, species) in GENUS_SPECIES_KNOWN
