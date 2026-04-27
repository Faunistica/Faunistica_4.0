import logging
from typing import Annotated

from fastapi import APIRouter, Query, Request

from core.rate_limiter import limiter
from schemas.taxonomy import AutofillTaxonRequest, AutofillTaxonResponse
from service import taxon

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/autofill")
@limiter.limit("10/second")
def autofill(
    request: Request,
    data: Annotated[AutofillTaxonRequest, Query()],
) -> AutofillTaxonResponse:
    """
    Автозаполнение полей таксономии.

    Автоматически заполняет семейство и род по частичному вводу.
    """
    return taxon.autofill(data.field, data.text)
