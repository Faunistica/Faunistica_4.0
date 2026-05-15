import logging
from dataclasses import dataclass
from typing import Literal
from uuid import UUID

from fastapi import Request, Response
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


@dataclass
class Ok:
    success: Literal[True] = True


@dataclass
class Err:
    success: Literal[False] = False


@dataclass
class MsgErr:
    error: str
    success: Literal[False] = False


class HandlerError(Exception):
    def __init__(self) -> None:
        super().__init__("incorrectly configured handler")


class DBException(Exception):
    def __init__(self, message: str, status_code: int, error_code: str) -> None:
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(message)


def db_exception_handler(request: Request, exc: Exception) -> Response:
    if isinstance(exc, DBException):
        logger.error("DB error: %s", exc, exc_info=True)
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.error_code, "message": exc.message},
        )
    raise exc


class APIException(Exception):
    def __init__(self, error_code: str, message: str, status_code: int = 400) -> None:
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def api_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.info(exc)
    if isinstance(exc, APIException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.error_code, "message": exc.message},
        )
    raise exc


class AdminOnlyError(APIException):
    def __init__(self) -> None:
        super().__init__(
            "ADMIN_ONLY", "This action is only availible for project admins", 403
        )


class PublicationNotFoundError(APIException):
    def __init__(self, publ_id: int) -> None:
        super().__init__("PUBL_NOT_FOUND", f"Publication {publ_id} not found", 404)


class PublicationForbiddenError(APIException):
    def __init__(self, user_id: int, publ_id: int) -> None:
        super().__init__(
            "PUBL_FORBIDDEN",
            f"Publication {publ_id} cannot be accessed in this way by user {user_id}",
            403,
        )


class NoPublicationsAssignedError(APIException):
    def __init__(self, user_id: str | int) -> None:
        super().__init__("NO_PUBL", f"User {user_id} has no assigned publications", 403)


class RecordForbiddenError(APIException):
    def __init__(self) -> None:
        super().__init__("RECORD_FORBIDDEN", "Cannot modify record", 403)


class UserNotFoundError(APIException):
    def __init__(self, id: str | int) -> None:
        super().__init__("USER_NOT_FOUND", f"User {id} not found", 404)


class ExpectationError(APIException):
    def __init__(self, message: str) -> None:
        super().__init__("EXPECT_FAIL", message, 500)


class RecordNotFoundError(APIException):
    def __init__(self, record_id: str | UUID) -> None:
        super().__init__("RECORD_NOT_FOUND", f"Record {record_id} not found", 404)


class QueueEmptyError(APIException):
    def __init__(self) -> None:
        super().__init__("QUEUE_EMPTY", "Publication queue is empty", 404)


class ActionLoggingError(APIException):
    def __init__(self, details: str) -> None:
        super().__init__(
            "ACTION_LOGGING_ERROR", f"Failed to log action: {details}", 500
        )


class InternalError(APIException):
    def __init__(self, details: str) -> None:
        super().__init__("INTERNAL_ERROR", details, 500)


class PublicationCompletedError(APIException):
    def __init__(self, publ_id: int) -> None:
        super().__init__(
            "PUBL_COMPLETED", f"Publication {publ_id} already completed", 403
        )


class RecordStaleError(APIException):
    def __init__(self, record_id: str | UUID) -> None:
        super().__init__(
            "RECORD_STALE", f"Record {record_id} was modified by another request", 409
        )


class RecordLimitExceededError(APIException):
    def __init__(
        self, publ_id: int, current_count: int, additional: int, limit: int
    ) -> None:
        self.publ_id = publ_id
        self.current_count = current_count
        self.additional = additional
        self.limit = limit
        super().__init__(
            "RECORD_LIMIT",
            f"Publication {publ_id}: adding {additional} more"
            f" would exceed limit of {limit} (currently {current_count})",
            400,
        )


class ImportLimitExceededError(APIException):
    def __init__(self, publ_id: int, batch_size: int, limit: int) -> None:
        self.publ_id = publ_id
        self.batch_size = batch_size
        self.limit = limit
        super().__init__(
            "IMPORT_LIMIT",
            f"Publication {publ_id}: batch size {batch_size} exceeds limit of {limit}",
            400,
        )
