import logging
from typing import Annotated

from fastapi import APIRouter, Query, Request

from core.rate_limiter import limiter
from schemas.taxonomy import SuggestTaxonRequest, SuggestTaxonResponse
from service import taxon

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/suggest")
@limiter.limit("10/second")
def suggest_taxon(
    request: Request,
    data: Annotated[SuggestTaxonRequest, Query()],
) -> SuggestTaxonResponse:
    """
    Подсказки таксонов.

    Предлагает таксоны для автодополнения с фильтрацией по семейству и роду.
    """
    suggestions = taxon.suggest(data.field, data.text, data.filters)
    return SuggestTaxonResponse(suggestions=suggestions)
