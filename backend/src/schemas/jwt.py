from datetime import datetime

from pydantic import BaseModel, Field


class TokenPayload(BaseModel):
    user_id: int = Field(alias="sub", by_alias=False)
    username: str


class Token(TokenPayload):
    type: str
    exp: datetime
