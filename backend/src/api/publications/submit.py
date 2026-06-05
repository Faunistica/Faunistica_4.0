import logging
from typing import Annotated, Literal

from fastapi import APIRouter, BackgroundTasks, Depends, status
from pydantic import BaseModel

from core.config import settings
from core.dependencies import ClientIP, HTTPClient, TokenUser
from schema.common import ProcessingLevel
from service.publications import PublicationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/publications")


class PublicationSubmit(BaseModel):
    processing_level: ProcessingLevel
    urals_scope: Literal["yes", "no"] | None = None
    material_status: Literal["yes", "no"] | None = None
    comment: str | None = None


async def _notify_admin(
    http_client: HTTPClient,
    publ_id: int,
    comment: str | None,
) -> None:
    if not comment:
        return
    try:
        text = (
            f"📬 Комментарий к публикации #{publ_id}:\n"
            f"{comment}"
        )
        url = (
            f"https://api.telegram.org/"
            f"bot{settings.BOT_TOKEN.get_secret_value()}/sendMessage"
        )
        async with http_client.post(
            url,
            json={"chat_id": settings.ADMIN_CHAT_ID, "text": text},
        ) as resp:
            resp.raise_for_status()
    except Exception:
        logger.exception("Failed to send admin notification for publ %d", publ_id)


class SubmitStatusResponse(BaseModel):
    draft_record_ids: list[str]


@router.get("/{publ_id}/submit-status")
async def submit_status(
    publ_id: int,
    token: TokenUser,
    pub_service: Annotated[PublicationService, Depends()],
) -> SubmitStatusResponse:
    await pub_service.validate_access(publ_id, user_id=token.user_id)
    draft_ids = await pub_service.get_draft_record_ids(token.user_id, publ_id)
    return SubmitStatusResponse(draft_record_ids=draft_ids)


@router.post("/{publ_id}/submit", status_code=status.HTTP_204_NO_CONTENT)
async def submit_publication(
    publ_id: int,
    data: PublicationSubmit,
    token: TokenUser,
    ip: ClientIP,
    bg_tasks: BackgroundTasks,
    http_client: HTTPClient,
    pub_service: Annotated[PublicationService, Depends()],
) -> None:
    await pub_service.submit(
        token.user_id,
        publ_id,
        data.processing_level,
        data.urals_scope,
        data.material_status,
        data.comment,
        ip,
    )

    bg_tasks.add_task(_notify_admin, http_client, publ_id, data.comment)
