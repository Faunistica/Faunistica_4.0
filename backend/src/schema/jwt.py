from datetime import datetime

from pydantic import BaseModel


class TokenPayload(BaseModel):
    sub: str
    username: str
    version: int = 0


class Token(TokenPayload):
    type: str
    exp: datetime
