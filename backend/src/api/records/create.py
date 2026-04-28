
from fastapi import APIRouter, HTTPException, status

from core.dependencies import ClientIP, DBSession, TokenUser
from repository import record as repo
from schema.records import RecordBelonging, RecordFull
from service.records import create_record_metadata

router = APIRouter(
    prefix="/records",
)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def create_record(
    belonging: RecordBelonging,
    session: DBSession,
    ip: ClientIP,
    token: TokenUser,
) -> RecordFull:
    if token.user_id != belonging.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    metadata = create_record_metadata(None, belonging, "autosave", ip)
    db_record = await repo.create_record(session, metadata)

    return RecordFull.model_validate(db_record.__dict__)
