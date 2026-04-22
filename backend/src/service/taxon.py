import logging

import pandas as pd

from core.config import settings
from schemas.taxonomy import AutofillTaxonResponse, TaxonomyFilters

logger = logging.getLogger(__name__)

csv_path = settings.SPECIES_CSV_PATH
df = pd.read_csv(csv_path, usecols=["family", "genus", "species"])


def suggest(field: str, text: str, filters: TaxonomyFilters | None) -> list[str]:
    if field not in ["species", "genus", "family"]:
        logger.warning("Invalid field. Must be 'species', 'genus', or 'family'")
        raise ValueError("Invalid field. Must be 'species', 'genus', or 'family'.")

    print(filters)

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


def autofill(field: str, text: str) -> AutofillTaxonResponse:
    if field == "family":
        return AutofillTaxonResponse(family=text, genus=None)
    if field not in ["genus", "species"]:
        logger.warning("Invalid field. Must be 'genus' or 'species'.")
        raise ValueError("Invalid field. Must be 'genus' or 'species'.")

    query_df = df.copy()
    match_df = query_df[query_df[field].str.lower() == text.lower()]

    if match_df.empty:
        return AutofillTaxonResponse(family=None, genus=None)

    row = match_df.iloc[0]

    return AutofillTaxonResponse(family=row["family"], genus=row["genus"])
