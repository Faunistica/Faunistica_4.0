import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Request

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
    try:
        suggestions = taxon.suggest(data.field, data.text, data.filters)
        return SuggestTaxonResponse(suggestions=suggestions)
    except ValueError as e:
        logger.error(f"Value error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e)) from e
