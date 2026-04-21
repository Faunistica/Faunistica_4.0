from fastapi import APIRouter, Request

from back_api.token import get_current_user

router = APIRouter()


@router.post("/check_auth")
async def check_auth(request: Request):
    user = get_current_user(request)
    return {"authenticated": True, "user_id": user["sub"], "username": user["username"]}
