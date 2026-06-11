import logging
from typing import Annotated, Literal

from fastapi import APIRouter, BackgroundTasks, Depends, status
from pydantic import BaseModel, Field

from core.dependencies import ClientIP, HTTPClient, TokenUser
from schema.common import ProcessingLevel
from service.publications import PublicationService
from service.telegram import notify_publication_completed
from service.user import UserService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/publications")


class PublicationSubmit(BaseModel):
    processing_level: ProcessingLevel
    urals_scope: Literal["yes", "no"] | None = None
    material_status: Literal["yes", "no"] | None = None
    comment: Annotated[str | None, Field(default=None, max_len=1000)]


class DraftsResponse(BaseModel):
    draft_record_ids: list[str]


@router.get("/{publ_id}/drafts")
async def get_drafts(
    publ_id: int,
    token: TokenUser,
    pub_service: Annotated[PublicationService, Depends()],
) -> DraftsResponse:
    await pub_service.validate_access(publ_id, user_id=token.user_id)
    draft_ids = await pub_service.get_draft_record_ids(token.user_id, publ_id)
    return DraftsResponse(draft_record_ids=draft_ids)


@router.post("/{publ_id}/submit", status_code=status.HTTP_204_NO_CONTENT)
async def submit_publication(
    publ_id: int,
    data: PublicationSubmit,
    token: TokenUser,
    ip: ClientIP,
    bg_tasks: BackgroundTasks,
    http_client: HTTPClient,
    pub_service: Annotated[PublicationService, Depends()],
    user_service: Annotated[UserService, Depends()],
) -> None:
    remaining = await pub_service.submit(
        token.user_id,
        publ_id,
        data.processing_level,
        data.urals_scope,
        data.material_status,
        data.comment,
        ip,
    )

    user = await user_service.get(token.user_id)
    tlg_username = user.tlg_username if user else None

    bg_tasks.add_task(
        notify_publication_completed,
        http_client,
        publ_id,
        token.user_id,
        token.name,
        tlg_username,
        data.comment,
        remaining,
    )
