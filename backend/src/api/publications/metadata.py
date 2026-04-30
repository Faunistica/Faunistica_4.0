import json
import logging

from fastapi import APIRouter, status
from pydantic import BaseModel

from core.dependencies import ClientIP, DBSession, TokenUser
from core.exceptions import (
    PublicationForbiddernError,
    PublicationNotFoundError,
)
from repository.publication import get_publication
from repository.user import get_user_expect
from service.actions import ActionService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/publications")


class PublicationMetadata(BaseModel):
    urals_scope: str | None = None
    material_status: str | None = None


@router.post("/{publ_id}/metadata", status_code=status.HTTP_204_NO_CONTENT)
async def set_publication_metadata(
    publ_id: int,
    data: PublicationMetadata,
    session: DBSession,
    token: TokenUser,
    ip: ClientIP,
) -> None:
    publication = await get_publication(session, publ_id)
    if not publication:
        raise PublicationNotFoundError(publ_id)

    user = await get_user_expect(session, token.user_id)
    if user.publ_id != publ_id:
        raise PublicationForbiddernError(publ_id, token.user_id)

    metadata = {}
    if data.urals_scope is not None:
        metadata["reg"] = data.urals_scope
    if data.material_status is not None:
        metadata["mat"] = data.material_status

    action_service = ActionService(session)
    if metadata:
        metadata["publ_id"] = str(publ_id)
        await action_service.save_action(
            token.user_id, "publ_rem_json", json.dumps(metadata), ip
        )
