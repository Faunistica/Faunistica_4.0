import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request

from api.schemas import SuggestTaxonRequest, SuggestTaxonResponse
from service.taxon import TaxonService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/suggest_taxon")
async def suggest_taxon(
    request: Request,
    data: SuggestTaxonRequest,
    taxons: Annotated[TaxonService, Depends()],
) -> SuggestTaxonResponse:
    try:
        suggestions = await taxons.async_suggestion(
            data.field, data.text, data.filters or {}
        )
        return SuggestTaxonResponse(suggestions=suggestions)
    except ValueError as e:
        logger.error(f"Value error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e)) from e
