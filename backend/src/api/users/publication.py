import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.rate_limiter import limiter
from api.schemas import PublResponse, RecordHashRequest
from database.database import get_session
from database.hash import decrypt_id
from service.publication import PublicationService
from service.record import RecordService
from service.token import get_current_user
from service.user import UserService

logger = logging.getLogger(__name__)
router = APIRouter()
base_url = "https://faunistica.ru/files/"


@router.get("/publication")
@limiter.limit("666/minute")
async def get_publication(
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


@router.get("/publication/next")
@limiter.limit("10/minute")
async def get_next_publication(
    request: Request,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    users: Annotated[UserService, Depends()],
    pubs: Annotated[PublicationService, Depends()],
) -> bool:
    user_id = int(user_data["sub"])
    user = await users.get_by_id(session, user_id)

    if user.publ_id is not None and not await pubs.is_filled_by_user(
        session, user_id, user.publ_id
    ):
        logger.warning("Publication is not filled")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Publication is not filled"
        )

    if user.items is None or len(user.items) == 0:
        logger.warning("No publications available for user %d", user_id)
        raise HTTPException(status_code=404, detail="No publications available")

    items = user.items.split("|")
    num_publ = items.index(str(user.publ_id)) if str(user.publ_id) in items else -1

    if (num_publ != -1) and (num_publ != len(items) - 1):
        publ_id = int(items[num_publ + 1])
        await users.update(session, user_id, publ_id=publ_id)
        return True
    return False


@router.post("/from-hash")
@limiter.limit("666/minute")
async def get_publication_from_hash(
    request: Request,
    data: RecordHashRequest,
    user_data: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    records_svc: Annotated[RecordService, Depends()],
) -> PublResponse:
    try:
        user_id = int(user_data["sub"])
        record_id = decrypt_id(data.hash)

        if record_id is None:
            logger.warning("Invalid record token")
            raise HTTPException(status_code=400, detail="Invalid record token.")

        publ = await records_svc.get_publication_by_hash(session, record_id, user_id)
        if publ is None:
            logger.warning("Publication not found")
            raise HTTPException(status_code=404, detail="Publication not found.")

        return PublResponse(
            author=publ.author,
            year=publ.year,
            name=publ.name,
            pdf_file=base_url + publ.pdf_file if publ.pdf_file else None,
        )

    except Exception as e:
        logger.error(f"HTTP Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Server database error: {str(e)}"
        ) from e
