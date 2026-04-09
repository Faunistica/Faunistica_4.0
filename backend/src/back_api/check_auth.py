from typing import Annotated

from fastapi import APIRouter, Depends, Request

from service.token import TokenService, get_token_service

router = APIRouter()


@router.post("/check_auth")
async def check_auth(
    request: Request,
    tokens: Annotated[TokenService, Depends(get_token_service)],
) -> dict[str, str | bool]:
    user = tokens.get_payload(request)
    return {"authenticated": True, "user_id": user["sub"], "username": user["username"]}
