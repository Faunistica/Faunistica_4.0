import logging

from fastapi import APIRouter, HTTPException, Request

from core.rate_limiter import limiter
from schemas.taxonomy import SuggestTaxonRequest, SuggestTaxonResponse
from service import taxon

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/suggest")
@limiter.limit("10/second")
def suggest_taxon(
    request: Request,
    data: SuggestTaxonRequest,
) -> SuggestTaxonResponse:
    try:
        suggestions = taxon.suggest(data.field, data.text, data.filters)
        return SuggestTaxonResponse(suggestions=suggestions)
    except ValueError as e:
        logger.error(f"Value error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e)) from e
