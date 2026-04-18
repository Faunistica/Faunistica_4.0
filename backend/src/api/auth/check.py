from typing import Annotated

from fastapi import APIRouter, Depends, Request
from core.security import TokenService

router = APIRouter()


@router.post("/check")
async def check_auth(
    request: Request,
    tokens: Annotated[TokenService, Depends()],
) -> dict[str, str | bool]:
    user = tokens.get_payload(request)
    return {"authenticated": True, "user_id": user["sub"], "username": user["username"]}
