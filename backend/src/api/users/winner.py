import logging

from fastapi import APIRouter, HTTPException, status

from core.dependencies import DBSession, TokenUser
from schema.common import WinnerInfo
from service.actions import ActionService

router = APIRouter()

logger = logging.getLogger(__name__)


@router.get("/me/winner")
async def get_winner_info(
    token: TokenUser,
    session: DBSession,
) -> WinnerInfo:
    service = ActionService(session)
    winner_info = await service.get_winner_info(token.user_id)

    if winner_info is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    return winner_info
