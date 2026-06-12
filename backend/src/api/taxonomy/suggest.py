import logging
from typing import Annotated

from fastapi import APIRouter, Query, Request

from schema.taxonomy import SuggestTaxonRequest, SuggestTaxonResponse, TaxonomyFilters
from service import taxon

logger = logging.getLogger(__name__)
router = APIRouter()

# TODO: Update to use GBIF API instead of local CSV file for taxonomy suggestions


@router.get("/suggest")
def suggest_taxon(
    request: Request,
    data: Annotated[SuggestTaxonRequest, Query()],
) -> SuggestTaxonResponse:
    """
    Подсказки таксонов.

    Предлагает таксоны для автодополнения с фильтрацией по семейству и роду.
    """
    suggestions = taxon.suggest(
        data.field, data.query, TaxonomyFilters(family=data.family, genus=data.genus)
    )
    return SuggestTaxonResponse(suggestions=suggestions)
