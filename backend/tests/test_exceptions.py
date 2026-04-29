import pytest
from httpx import AsyncClient

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
    assert exc.error_code.value == "PUBL_NOT_FOUND"
    assert exc.status_code == 404


def test_record_forbidden_error() -> None:
    exc = RecordForbiddenError()
    assert exc.error_code.value == "RECORD_FORBIDDEN"
    assert exc.status_code == 403


def test_user_not_found_error() -> None:
    exc = UserNotFoundError(user_id=1)
    assert exc.error_code.value == "USER_NOT_FOUND"
    assert exc.status_code == 404


def test_record_not_found_error() -> None:
    exc = RecordNotFoundError(record_id="abc")
    assert exc.error_code.value == "RECORD_NOT_FOUND"
    assert exc.status_code == 404


def test_queue_empty_error() -> None:
    exc = QueueEmptyError()
    assert exc.error_code.value == "QUEUE_EMPTY"
    assert exc.status_code == 404


def test_action_logging_error() -> None:
    exc = ActionLoggingError(details="db error")
    assert exc.error_code.value == "ACTION_LOGGING_ERROR"
    assert exc.status_code == 500


@pytest.mark.asyncio
async def test_exception_handler_returns_json(async_client: AsyncClient) -> None:
    from app import app
    from core.exceptions import PublicationNotFoundError

    async def raise_exc():
        raise PublicationNotFoundError(publ_id=999)

    app.add_api_route("/test-exc", raise_exc, methods=["GET"])
    response = await async_client.get("/test-exc")
    assert response.status_code == 404
    data = response.json()
    assert data == {"error": "PUBL_NOT_FOUND", "message": "Publication 999 not found"}
