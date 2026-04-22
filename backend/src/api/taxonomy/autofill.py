import logging

from fastapi import APIRouter, HTTPException, Request

from core.rate_limiter import limiter
from schemas.taxonomy import AutofillTaxonRequest, AutofillTaxonResponse
from service import taxon

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/autofill")
@limiter.limit("10/second")
def autofill(
    request: Request,
    data: AutofillTaxonRequest,
) -> AutofillTaxonResponse:
    try:
        return taxon.autofill(data.field, data.text)
    except ValueError as e:
        logger.error(f"Value error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e)) from e
