from typing import Annotated

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from core.dependencies import ClientIP, DBSession, TokenUser
from repository import record as repo
from schema.records import RecordFull
from service.actions import ActionService
from service.milestone import check_and_log_milestone
from service.records import create_record_metadata

router = APIRouter(
    prefix="/records",
)


# idk, a funny name, made up without ai!
class CreateRecordRequest(BaseModel):
    publ_id: int


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def create_record(
    data: CreateRecordRequest,
    session: DBSession,
    ip: ClientIP,
    token: TokenUser,
    action_service: Annotated[ActionService, Depends()],
) -> RecordFull:
    metadata = create_record_metadata(
        None,
        user_id=token.user_id,
        publ_id=data.publ_id,
        submission_type="autosave",
        ip=ip,
    )
    db_record = await repo.create_record(session, metadata)

    if db_record.type == "rec_ok":
        # TODO: run in a background task
        await check_and_log_milestone(session, token.user_id, db_record, action_service)

    return RecordFull.model_validate(db_record.__dict__)
