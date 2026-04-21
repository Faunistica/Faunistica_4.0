import logging

from fastapi import APIRouter, HTTPException, Request

from schemas.taxonomy import SuggestTaxonRequest, SuggestTaxonResponse
from service import taxon

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/suggest")
def suggest_taxon(
    request: Request,
    data: SuggestTaxonRequest,
) -> SuggestTaxonResponse:
    try:
        suggestions = taxon.suggest(data.field, data.text, data.filters or {})
        return SuggestTaxonResponse(suggestions=suggestions)
    except ValueError as e:
        logger.error(f"Value error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e)) from e
