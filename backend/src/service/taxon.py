import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)

# FIXME: through config?
csv_path = Path(__file__).resolve().parent.parent.parent / "species_export_20250503.csv"
df = pd.read_csv(csv_path, usecols=["family", "genus", "species"])
executor = ThreadPoolExecutor()


class TaxonService:
    def suggestion(
        self, field: str, text: str, filters: dict[str, str | None]
    ) -> list[str]:
        if field not in ["species", "genus", "family"]:
            logger.warning("Invalid field. Must be 'species', 'genus', or 'family'")
            raise ValueError("Invalid field. Must be 'species', 'genus', or 'family'.")

        query_df = df.copy()

        if filters.get("family"):
            query_df = query_df[
                query_df["family"].str.contains(filters["family"], case=False, na=False)
            ]

        if filters.get("genus"):
            query_df = query_df[
                query_df["genus"].str.contains(filters["genus"], case=False, na=False)
            ]

        suggestions = query_df[field]

        filtered = (
            suggestions[suggestions.str.contains(text, case=False, na=False)]
            .dropna()
            .drop_duplicates()
            .sort_values()
        )

        return filtered.tolist()

    async def async_suggestion(
        self, field: str, text: str, filters: dict[str, str | None]
    ) -> list[str]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            executor, self.suggestion, field, text, filters
        )


_taxon_service: TaxonService | None = None


def get_taxon_service() -> TaxonService:
    global _taxon_service
    if _taxon_service is None:
        _taxon_service = TaxonService()
    return _taxon_service
