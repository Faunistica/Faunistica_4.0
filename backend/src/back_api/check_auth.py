from fastapi import APIRouter, Request

from service.token import get_current_user

router = APIRouter()


@router.post("/check_auth")
async def check_auth(request: Request) -> dict[str, str | bool]:
    user = get_current_user(request)
    return {"authenticated": True, "user_id": user["sub"], "username": user["username"]}
