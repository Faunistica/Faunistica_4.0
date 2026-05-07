import io
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from openpyxl import Workbook

from core.exceptions import NoPublicationsAssignedError, RecordLimitExceededError
from schema.records import RecordData
from service.export import COLUMN_MAPPING, ParseResult
from service.records import ImportResult, RecordService


def create_parse_result(
    success: bool, record_data: dict | None = None, error=None
) -> ParseResult:
    """Helper to create ParseResult."""
    if success and record_data:
        return {
            "success": True,
            "record": RecordData(**record_data),
            "error": None,
        }
    return {"success": False, "record": None, "error": error}


def make_record_generator(
    items: list[dict],
) -> AsyncGenerator[ParseResult, None]:
    """Create an async generator from a list of record dicts."""

    async def gen() -> AsyncGenerator[ParseResult, None]:
        for item in items:
            if item.get("error"):
                yield {"success": False, "record": None, "error": item["error"]}
            else:
                yield {
                    "success": True,
                    "record": RecordData(**item),
                    "error": None,
                }

    return gen()


@pytest.fixture
def mock_session():
    """Create a mock database session."""
    session = AsyncMock()
    session.add_all = MagicMock()
    session.commit = AsyncMock()
    return session


@pytest.fixture
def mock_publication_service():
    """Create a mock publication service."""
    service = AsyncMock()
    service.validate_access = AsyncMock()
    return service


@pytest.fixture
def mock_action_service():
    """Create a mock action service."""
    return AsyncMock()


@pytest.fixture
def record_service(mock_session, mock_publication_service, mock_action_service):
    """Create a RecordService with mocked dependencies."""
    return RecordService(
        session=mock_session,
        publication_service=mock_publication_service,
        action_service=mock_action_service,
    )


class TestImportRecords:
    """Test cases for RecordService.import_records method."""

    async def test_successful_import(
        self,
        record_service: RecordService,
        mock_session: MagicMock,
        mock_publication_service: MagicMock,
    ) -> None:
        """Test importing valid records successfully."""
        user_id = 12345
        publ_id = 67890

        # Mock user with publication
        mock_user = MagicMock()
        mock_user.publ_id = publ_id
        mock_user.user_id = user_id

        with (
            patch("service.records.get_user_expect", AsyncMock(return_value=mock_user)),
            patch("service.records.count_records_by_publ", AsyncMock(return_value=0)),
            patch("service.records.check_and_log_milestone", AsyncMock()),
        ):
            records_data = [
                RecordData(
                    family="Formicidae", genus="Camponotus", species="herculeanus"
                ),
                RecordData(family="Formicidae", genus="Lasius", species="niger"),
            ]

            async def gen() -> AsyncGenerator[ParseResult, None]:
                for record_data in records_data:
                    yield {
                        "success": True,
                        "record": record_data,
                        "error": None,
                    }

            result = await record_service.import_records(
                gen(), user_id=user_id, ip="127.0.0.1"
            )

            assert isinstance(result, ImportResult)
            assert result.imported == 2
            assert result.failed == 0
            assert len(result.errors) == 0
            mock_session.add_all.assert_called_once()
            mock_session.commit.assert_called_once()

    async def test_import_with_errors(
        self,
        record_service: RecordService,
        mock_session: MagicMock,
        mock_publication_service: MagicMock,
    ) -> None:
        """Test import with some invalid rows."""
        from pydantic import ValidationError

        user_id = 12345
        publ_id = 67890

        mock_user = MagicMock()
        mock_user.publ_id = publ_id
        mock_user.user_id = user_id

        with (
            patch("service.records.get_user_expect", AsyncMock(return_value=mock_user)),
            patch("service.records.count_records_by_publ", AsyncMock(return_value=0)),
        ):
            # Create a mock ValidationError
            mock_error = MagicMock(spec=ValidationError)
            mock_error.json.return_value = '[{"msg": "Validation failed"}]'

            async def gen() -> AsyncGenerator[ParseResult, None]:
                # Valid record
                yield {
                    "success": True,
                    "record": RecordData(family="Formicidae", genus="Camponotus"),
                    "error": None,
                }
                # Invalid record (simulate validation error)
                yield {"success": False, "record": None, "error": mock_error}
                # Valid record
                yield {
                    "success": True,
                    "record": RecordData(family="Formicidae", genus="Lasius"),
                    "error": None,
                }

            result = await record_service.import_records(
                gen(), user_id=user_id, ip="127.0.0.1"
            )

            assert result.imported == 2
            assert result.failed == 1
            assert len(result.errors) == 1
            assert result.errors[0].row == 2

    async def test_import_empty_rows(
        self,
        record_service: RecordService,
        mock_session: MagicMock,
        mock_publication_service: MagicMock,
    ) -> None:
        """Test import with empty rows (all None values)."""
        user_id = 12345
        publ_id = 67890

        mock_user = MagicMock()
        mock_user.publ_id = publ_id
        mock_user.user_id = user_id

        with (
            patch("service.records.get_user_expect", AsyncMock(return_value=mock_user)),
            patch("service.records.count_records_by_publ", AsyncMock(return_value=0)),
        ):

            async def gen() -> AsyncGenerator[ParseResult, None]:
                # Empty row (will be caught by is_row_empty)
                yield {
                    "success": True,
                    "record": RecordData(family=None, genus=None, species=None),
                    "error": None,
                }

            result = await record_service.import_records(
                gen(), user_id=user_id, ip="127.0.0.1"
            )

            assert result.imported == 0
            assert result.failed == 1

    async def test_user_without_publ(
        self,
        record_service: RecordService,
        mock_session: MagicMock,
        mock_publication_service: MagicMock,
    ) -> None:
        """Test import when user has no publication assigned."""
        user_id = 12345

        mock_user = MagicMock()
        mock_user.publ_id = None
        mock_user.user_id = user_id

        with patch(
            "service.records.get_user_expect", AsyncMock(return_value=mock_user)
        ):

            async def gen() -> AsyncGenerator[ParseResult, None]:
                yield {
                    "success": True,
                    "record": RecordData(family="Formicidae"),
                    "error": None,
                }

            with pytest.raises(NoPublicationsAssignedError):
                await record_service.import_records(
                    gen(), user_id=user_id, ip="127.0.0.1"
                )

    async def test_import_limit_exceeded(
        self,
        record_service: RecordService,
        mock_session: MagicMock,
        mock_publication_service: MagicMock,
    ) -> None:
        """Test import limit enforcement."""
        user_id = 12345
        publ_id = 67890

        mock_user = MagicMock()
        mock_user.publ_id = publ_id
        mock_user.user_id = user_id

        with (
            patch("service.records.get_user_expect", AsyncMock(return_value=mock_user)),
            # Simulate already at limit
            patch(
                "service.records.count_records_by_publ", AsyncMock(return_value=1000)
            ),
        ):

            async def gen() -> AsyncGenerator[ParseResult, None]:
                yield {
                    "success": True,
                    "record": RecordData(family="Formicidae"),
                    "error": None,
                }

            with pytest.raises(RecordLimitExceededError):
                await record_service.import_records(
                    gen(), user_id=user_id, ip="127.0.0.1"
                )

    async def test_boolean_fields_parsing(
        self,
        record_service: RecordService,
        mock_session: MagicMock,
        mock_publication_service: MagicMock,
    ) -> None:
        """Test that boolean fields are parsed correctly."""
        user_id = 12345
        publ_id = 67890

        mock_user = MagicMock()
        mock_user.publ_id = publ_id
        mock_user.user_id = user_id

        with (
            patch("service.records.get_user_expect", AsyncMock(return_value=mock_user)),
            patch("service.records.count_records_by_publ", AsyncMock(return_value=0)),
            patch("service.records.check_and_log_milestone", AsyncMock()),
        ):
            records_data = [
                RecordData(
                    family="Formicidae",
                    is_manual_location=True,
                    is_interval=False,
                ),
            ]

            async def gen() -> AsyncGenerator[ParseResult, None]:
                for record_data in records_data:
                    yield {
                        "success": True,
                        "record": record_data,
                        "error": None,
                    }

            result = await record_service.import_records(
                gen(), user_id=user_id, ip="127.0.0.1"
            )

            assert result.imported == 1
            # Check that session.add_all was called with correct data
            call_args = mock_session.add_all.call_args
            event_records = call_args[0][0]
            assert len(event_records) == 1
            assert event_records[0].is_manual_location is True
            assert event_records[0].is_interval is False

    async def test_import_from_excel_format(
        self,
        record_service: RecordService,
        mock_session: MagicMock,
        mock_publication_service: MagicMock,
    ) -> None:
        """Test that Excel import parsing works correctly."""
        from service.export import read_excel

        user_id = 12345
        publ_id = 67890

        mock_user = MagicMock()
        mock_user.publ_id = publ_id
        mock_user.user_id = user_id

        # Create a minimal Excel file
        wb = Workbook()
        ws = wb.active
        if ws is None:
            pytest.fail("Workbook active sheet is None")

        headers = list(COLUMN_MAPPING.values())
        ws.append(headers)
        ws.append(["Formicidae", "Camponotus", "herculeanus", "Finland"])

        output = io.BytesIO()
        wb.save(output)
        excel_content = output.getvalue()

        with (
            patch("service.records.get_user_expect", AsyncMock(return_value=mock_user)),
            patch("service.records.count_records_by_publ", AsyncMock(return_value=0)),
            patch("service.records.check_and_log_milestone", AsyncMock()),
        ):
            result = await record_service.import_records(
                read_excel(excel_content), user_id=user_id, ip="127.0.0.1"
            )

            assert result.imported >= 1
            assert result.failed == 0
