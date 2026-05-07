import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from core.config import settings
from core.dependencies import ClientIP, DBSession, TokenUser
from core.exceptions import NoPublicationsAssignedError
from core.rate_limiter import limiter
from repository.user import get_user_expect
from service.export import read_csv, read_excel
from service.records import ImportResult, RecordService

router = APIRouter(prefix="/records")

logger = logging.getLogger(__name__)


@router.post("/import")
@limiter.limit("1/minute")
async def import_records(
    request: Request,
    file: Annotated[
        UploadFile, File(description="xlsx or csv file, same format as import returns")
    ],
    ip: ClientIP,
    token: TokenUser,
    session: DBSession,
    service: Annotated[RecordService, Depends()],
) -> ImportResult:
    try:
        content = await file.read()
    except Exception:
        return {"imported": 0, "failed": 0, "errors": []}

    # TODO: use file size

    if len(content) > settings.MAX_IMPORT_FILE_BYTES:
        return {"imported": 0, "failed": 0, "errors": []}

    user = await get_user_expect(session, token.user_id)
    if user.publ_id is None:
        raise NoPublicationsAssignedError(user.user_id)

    filename = file.filename or ""
    if filename.endswith(".xlsx"):
        records = read_excel(content)
    elif filename.endswith(".csv"):
        records = read_csv(content)
    else:
        raise HTTPException(
            status_code=400,
            detail="Couldn't determine file type: file extention is not xlsx or csv",
        )

    return await service.import_records(records, token.user_id, user.publ_id, ip)
