from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status

from core.dependencies import ClientIP, DBSession, TokenUser
from core.exceptions import InternalError, RecordForbiddenError, RecordNotFoundError
from core.security import validate_user_id_query
from repository import record as repo
from repository.user import get_user_expect
from schema.records import RecordBelonging, RecordData, RecordFull
from service.records import create_record_metadata

router = APIRouter(prefix="/records/{record_id}")


@router.get("")
async def get_record(
    record_id: UUID,
    session: DBSession,
    user_id: Annotated[int, Depends(validate_user_id_query)],
) -> RecordFull:
    record = await repo.get_record(session, record_id)
    if record is None:
        raise RecordNotFoundError(record_id)

    if record.user_id != user_id:
        raise RecordForbiddenError

    return RecordFull.model_validate(record.__dict__)


@router.put("")
async def update_record(
    record_id: UUID,
    data: RecordData,
    session: DBSession,
    user: TokenUser,
    ip: ClientIP,
) -> RecordFull:
    user_id = user.user_id

    # Get the current record to check ownership and get updated_at
    current_record = await repo.get_record(session, record_id)
    if not current_record:
        raise RecordNotFoundError(record_id)

    if current_record.user_id != user_id:
        raise RecordForbiddenError

    metadata = create_record_metadata(
        None,
        RecordBelonging(publ_id=data.publ_id, user_id=user_id),
        "autosave",
        ip=ip,
        # Use the current record's updated_at for optimistic locking
        updated_at=current_record.updated_at,
    )

    record = await repo.update_record(session, record_id, data, metadata)
    if not record:
        raise RecordNotFoundError(record_id)

    return RecordFull.model_validate(record.__dict__)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(
    record_id: UUID,
    session: DBSession,
    token: TokenUser,
) -> None:
    user_id = token.user_id

    record = await repo.get_record(session, record_id)
    if record is None or record.user_id != user_id:
        raise RecordNotFoundError(record_id)

    user = await get_user_expect(session, user_id)
    if user.publ_id is None or record.publ_id != user.publ_id:
        raise RecordForbiddenError

    deleted = await repo.delete_record(session, record_id)
    if not deleted:
        raise InternalError(
            "couldn't delete record which was previously found. "
            f"record id = {record_id}"
        )
