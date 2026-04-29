import logging

from fastapi import APIRouter

from core.dependencies import DBSession, TokenUser
from core.exceptions import UserNotFoundError
from repository.publication import get_publication, get_user_with_queue

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/current", tags=["publications"])


def pipe_to_array(pipe_str: str) -> list[int]:
    """Convert '123|456|789' to [123, 456, 789]"""
    if not pipe_str:
        return []
    return [int(x) for x in pipe_str.split("|") if x.strip()]


def array_to_pipe(arr: list[int]) -> str:
    """Convert [123, 456, 789] to '123|456|789'"""
    return "|".join(str(x) for x in arr)


@router.get("")
async def get_current_publication(
    session: DBSession,
    token: TokenUser,
) -> dict:
    logger.debug("get_current_publication called for user %s", token.user_id)
    user = await get_user_with_queue(session, token.user_id)
    if not user:
        logger.error("User not found: %s", token.user_id)
        raise UserNotFoundError(token.user_id)

    logger.debug("User items: %s", user.items)
    queue = pipe_to_array(user.items)
    if not queue:
        logger.debug("Queue is empty")
        return {"publ_id": None, "queue_remaining": 0}

    publ_id = queue[0]
    logger.debug("Getting publication: %s", publ_id)
    publ = await get_publication(session, publ_id)
    if not publ:
        logger.error("Publication not found: %s", publ_id)
        return {"publ_id": None, "queue_remaining": 0}

    return {
        "publ_id": publ.id,
        "author": publ.author,
        "year": publ.year,
        "name": publ.name,
        "pdf_url": publ.pdf_file,
        "queue_remaining": len(queue) - 1,
    }
