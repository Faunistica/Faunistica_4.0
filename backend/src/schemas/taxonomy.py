from pydantic import BaseModel


class SuggestTaxonRequest(BaseModel):
    field: str
    text: str
    filters: dict[str, str | None] | None = None


class SuggestTaxonResponse(BaseModel):
    suggestions: list[str] | None = None


class AutofillTaxonRequest(BaseModel):
    field: str
    text: str


class AutofillTaxonResponse(BaseModel):
    family: str | None = None
    genus: str | None = None
