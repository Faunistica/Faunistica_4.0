import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.rate_limiter import limiter
from api.schemas import PublResponse
from database.database import get_session
from service.token import get_current_user
from service.user import UserService

logger = logging.getLogger(__name__)
router = APIRouter()
base_url = "https://faunistica.ru/files/"


@router.get("/get_publ")
@limiter.limit("666/minute")
async def get_publ(
    request: Request,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    users: Annotated[UserService, Depends()],
) -> PublResponse:
    try:
        data = await users.get_username_and_current_publication(
            session, int(user_data["sub"])
        )

        return PublResponse(
            author=data["publication"]["author"],
            year=data["publication"]["year"],
            name=data["publication"]["name"],
            pdf_file=base_url + data["publication"]["pdf_file"],
        )
    except Exception as e:
        logger.error(f"HTTP Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Server database error: {str(e)}"
        ) from e
