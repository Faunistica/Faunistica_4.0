
from core.exceptions import (
    ActionLoggingError,
    PublicationNotFoundError,
    QueueEmptyError,
    RecordForbiddenError,
    RecordNotFoundError,
    UserNotFoundError,
)


def test_publication_not_found_error() -> None:
    exc = PublicationNotFoundError(publ_id=1)
    assert exc.error_code == "PUBL_NOT_FOUND"
    assert exc.status_code == 404


def test_record_forbidden_error() -> None:
    exc = RecordForbiddenError()
    assert exc.error_code == "RECORD_FORBIDDEN"
    assert exc.status_code == 403


def test_user_not_found_error() -> None:
    exc = UserNotFoundError(id=1)
    assert exc.error_code == "USER_NOT_FOUND"
    assert exc.status_code == 404


def test_record_not_found_error() -> None:
    exc = RecordNotFoundError(record_id="abc")
    assert exc.error_code == "RECORD_NOT_FOUND"
    assert exc.status_code == 404


def test_queue_empty_error() -> None:
    exc = QueueEmptyError()
    assert exc.error_code == "QUEUE_EMPTY"
    assert exc.status_code == 404


def test_action_logging_error() -> None:
    exc = ActionLoggingError(details="db error")
    assert exc.error_code == "ACTION_LOGGING_ERROR"
    assert exc.status_code == 500
