import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status

from core.config import settings
from core.dependencies import ClientIP, TokenUser
from core.rate_limiter import limiter
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
    service: Annotated[RecordService, Depends()],
) -> ImportResult:
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            detail="Couldn't read file", status_code=status.HTTP_404_NOT_FOUND
        ) from e
    # TODO: use file size

    if len(content) > settings.MAX_IMPORT_FILE_BYTES:
        raise HTTPException(
            detail=f"File larger than max size of {settings.MAX_IMPORT_FILE_BYTES}",
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
        )

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

    return await service.import_records(records, token.user_id, ip)
