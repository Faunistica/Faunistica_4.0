import logging
from typing import Annotated, TypedDict
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Request, UploadFile

from core.config import settings
from core.dependencies import DBSession, TokenUser
from core.exceptions import RecordLimitExceededError
from core.model import EventRecord
from core.rate_limiter import limiter
from repository.user import get_user_expect
from service.export import (
    ImportRecordData,
    is_row_empty,
    read_csv,
    read_excel,
    row_to_record_data,
)
from service.records import RecordService, _mock_validate_record

router = APIRouter(prefix="/records")

logger = logging.getLogger(__name__)


class ImportResult(TypedDict):
    imported: int
    failed: int


@router.post("/import")
@limiter.limit("1/minute")
async def import_records(
    request: Request,
    file: Annotated[UploadFile, File(...)],
    token: TokenUser,
    session: DBSession,
    service: Annotated[RecordService, Depends()],
) -> ImportResult:
    try:
        content = await file.read()
    except Exception:
        return {"imported": 0, "failed": 0}

    if len(content) > settings.MAX_IMPORT_FILE_BYTES:
        return {"imported": 0, "failed": 0}

    filename = file.filename or ""
    if filename.endswith(".xlsx"):
        rows = await read_excel(content)
    elif filename.endswith(".csv"):
        rows = await read_csv(content)
    else:
        return {"imported": 0, "failed": 0}

    records_data: list[ImportRecordData] = []
    failed_count = 0

    user = await get_user_expect(session, token.user_id)
    if user.publ_id is None:
        return {"imported": 0, "failed": 0}

    publ_id = user.publ_id

    for row in rows:
        if is_row_empty(row):
            continue

        record_data = row_to_record_data(row, publ_id)
        errors = _mock_validate_record(record_data)
        record_type = "rec_ok" if errors is None else "rec_fail"

        records_data.append(
            {
                "record_data": record_data,
                "errors": errors,
                "record_type": record_type,
            }
        )
        if errors is not None:
            failed_count += 1

    try:
        await service.check_import_limit(publ_id, len(records_data))
    except RecordLimitExceededError:
        return {"imported": 0, "failed": 0}

    event_records = [
        EventRecord(
            id=uuid4(),
            publ_id=publ_id,
            user_id=token.user_id,
            errors=item["errors"],
            type=item["record_type"],
            **item["record_data"].model_dump(exclude_none=True, exclude={"publ_id"}),
        )
        for item in records_data
    ]

    session.add_all(event_records)
    await session.commit()

    return {"imported": len(records_data) - failed_count, "failed": failed_count}
