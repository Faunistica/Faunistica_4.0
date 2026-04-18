from fastapi import APIRouter, Response

from schemas import Message

router = APIRouter()


@router.post("/logout")
async def logout(response: Response) -> Message:
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")

    return Message(message="Successfully logged out")
