class APIException(Exception):
    def __init__(self, error_code: str, message: str, status_code: int = 400) -> None:
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class PublicationNotFoundError(APIException):
    def __init__(self, publ_id: int) -> None:
        super().__init__("PUBL_NOT_FOUND", f"Publication {publ_id} not found", 404)


class RecordForbiddenError(APIException):
    def __init__(self) -> None:
        super().__init__(
            "RECORD_FORBIDDEN", "Cannot modify record from previous publication", 403
        )


class UserNotFoundError(APIException):
    def __init__(self, identifier: str | int) -> None:
        super().__init__("USER_NOT_FOUND", f"User {identifier} not found", 404)


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
