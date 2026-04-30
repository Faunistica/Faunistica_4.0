import json
import logging

from fastapi import APIRouter, status
from pydantic import BaseModel

from core.dependencies import ClientIP, DBSession, TokenUser
from core.exceptions import PublicationCompletedError, PublicationNotFoundError
from repository.user import get_user_expect
from service.actions import ActionService
from service.publications import pipe_to_array

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
    user = await get_user_expect(session, token.user_id)

    action_service = ActionService(session)
    if await action_service.is_publication_completed(token.user_id, publ_id):
        raise PublicationCompletedError(publ_id)

    queue = pipe_to_array(user.items)

    if not queue or publ_id not in queue:
        raise PublicationNotFoundError(publ_id)

    metadata = {}
    if data.urals_scope is not None:
        metadata["reg"] = data.urals_scope
    if data.material_status is not None:
        metadata["mat"] = data.material_status

    if metadata:
        metadata["publ_id"] = str(publ_id)
        await action_service.save_action(
            token.user_id, "publ_rem_json", json.dumps(metadata), ip
        )
