from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TokenPayload(BaseModel):
    user_id: int = Field(alias="sub", by_alias=False)
    username: str

    model_config = ConfigDict(populate_by_name=True)


class Token(TokenPayload):
    type: str
    exp: datetime
