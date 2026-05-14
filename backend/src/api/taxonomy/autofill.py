import logging
from typing import Annotated

from fastapi import APIRouter, Query, Request

from schema.taxonomy import AutofillTaxonRequest, AutofillTaxonResponse
from service import taxon

router = APIRouter()
logger = logging.getLogger(__name__)

# TODO: Update to use GBIF API instead of local CSV file for taxonomy autofill


@router.get("/autofill")
def autofill(
    request: Request,
    data: Annotated[AutofillTaxonRequest, Query()],
) -> AutofillTaxonResponse:
    """
    Автозаполнение полей таксономии.

    Автоматически заполняет семейство и род по частичному вводу.
    """
    return taxon.autofill(data.field, data.text)
