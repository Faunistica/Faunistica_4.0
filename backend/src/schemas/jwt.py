from datetime import datetime

from pydantic import BaseModel


class TokenPayload(BaseModel):
    sub: str
    username: str


class Token(TokenPayload):
    type: str
    exp: datetime
