from typing import Literal

from pydantic import BaseModel

type TaxonomyField = Literal["family", "genus", "species"]


class SpecimenCount(BaseModel):
    gender: Literal["male", "female", "undefined"]
    maturity: Literal["adult", "juvenile"]
    count: float | None = None


class SpecimenCounts(BaseModel):
    specimens: list[SpecimenCount] = []


class TaxonomyFilters(BaseModel):
    family: str | None = None
    genus: str | None = None


class SuggestTaxonRequest(BaseModel):
    field: TaxonomyField
    text: str
    filters: TaxonomyFilters | None = None


class SuggestTaxonResponse(BaseModel):
    suggestions: list[str] | None = None


class AutofillTaxonRequest(BaseModel):
    field: TaxonomyField
    text: str


class AutofillTaxonResponse(BaseModel):
    family: str | None = None
    genus: str | None = None
