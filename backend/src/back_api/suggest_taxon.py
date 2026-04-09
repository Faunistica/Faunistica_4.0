import logging

from fastapi import APIRouter, HTTPException, Request

from back_api.schemas import SuggestTaxonRequest, SuggestTaxonResponse
from service.taxon import async_suggestion

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/suggest_taxon")
async def suggest_taxon(
    request: Request,
    data: SuggestTaxonRequest,
) -> SuggestTaxonResponse:
    try:
        suggestions = await async_suggestion(data.field, data.text, data.filters or {})
        return SuggestTaxonResponse(suggestions=suggestions)
    except ValueError as e:
        logger.error(f"Value error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e)) from e
