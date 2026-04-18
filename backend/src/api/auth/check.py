from fastapi import APIRouter, Request

from core.security import get_token_payload

router = APIRouter()


@router.post("/check")
async def check_auth(
    request: Request,
) -> dict[str, str | bool]:
    user = get_token_payload(request)
    return {"authenticated": True, "user_id": user["sub"], "username": user["username"]}
