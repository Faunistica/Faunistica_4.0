import logging

from fastapi import Request, Response
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class DBException(Exception):
    pass


def db_exception_handler(request: Request, exc: Exception) -> Response:
    if isinstance(exc, DBException):
        logger.error("SQLAlchemyError", exc_info=True)
    raise exc


class APIException(Exception):
    def __init__(self, error_code: str, message: str, status_code: int = 400) -> None:
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def api_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    if isinstance(exc, APIException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.error_code, "message": exc.message},
        )
    raise exc


class PublicationNotFoundError(APIException):
    def __init__(self, publ_id: int) -> None:
        super().__init__("PUBL_NOT_FOUND", f"Publication {publ_id} not found", 404)


class NoPublicationsAssignedError(APIException):
    def __init__(self, user_id: str | int) -> None:
        super().__init__("NO_PUBL", f"User {user_id} has no assigned publications", 404)


class RecordForbiddenError(APIException):
    def __init__(self) -> None:
        super().__init__(
            "RECORD_FORBIDDEN", "Cannot modify record from previous publication", 403
        )


class UserNotFoundError(APIException):
    def __init__(self, id: str | int) -> None:
        super().__init__("USER_NOT_FOUND", f"User {id} not found", 404)


class RecordNotFoundError(APIException):
    def __init__(self, record_id: str) -> None:
        super().__init__("RECORD_NOT_FOUND", f"Record {record_id} not found", 404)


class QueueEmptyError(APIException):
    def __init__(self) -> None:
        super().__init__("QUEUE_EMPTY", "Publication queue is empty", 404)


class ActionLoggingError(APIException):
    def __init__(self, details: str) -> None:
        super().__init__(
            "ACTION_LOGGING_ERROR", f"Failed to log action: {details}", 500
        )
