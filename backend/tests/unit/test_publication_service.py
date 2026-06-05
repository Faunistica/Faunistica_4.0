from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import TokenUser
from core.exceptions import (
    PublicationForbiddenError,
    PublicationNotFoundError,
    UnsubmittedRecordsError,
)
from core.model import User
from schema.common import ProcessingLevel, Publication
from schema.user import UserMinimal
from service.actions import ActionService
from service.publications import (
    PublicationService,
)


@pytest.fixture
def mock_session() -> MagicMock:
    return MagicMock(spec=AsyncSession)


@pytest.fixture
def mock_action_service() -> MagicMock:
    return MagicMock(spec=ActionService)


@pytest.fixture
def publication_service(
    mock_session: MagicMock, mock_action_service: MagicMock
) -> PublicationService:
    return PublicationService(mock_session, mock_action_service)


@pytest.fixture
def token_user() -> UserMinimal:
    return UserMinimal(user_id=1, name="testuser")


# ============================================================================
# TESTS FOR VALIDATE_ACCESS
# ============================================================================


class TestValidateAccess:
    @pytest.fixture(autouse=True, scope="function")
    def setup_mocks(self):
        with (
            patch(
                "service.publications.get_publication", new_callable=AsyncMock
            ) as self.mock_get_pub,
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as self.mock_get_user,
        ):
            yield

    @pytest.mark.asyncio
    async def test_valid_access(self, publication_service: PublicationService) -> None:
        """Test that validate_access passes when user.items[0] matches."""
        mock_user = User(user_id=1, items="123")
        mock_publ = Publication(
            publ_id=123,
            type="A",
            year=2000,
            name="publ",
            language="rus",
            ural=1,
            resume="resume",
        )

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub.return_value = mock_publ

        await publication_service.validate_access(123, user_id=1)

    @pytest.mark.asyncio
    async def test_invalid_access(
        self, publication_service: PublicationService
    ) -> None:
        """Test that validate_access raises PublicationForbiddenError when mismatch."""
        mock_user = User(user_id=1, items="456")
        mock_publ = Publication(
            publ_id=123,
            type="A",
            year=2000,
            name="publ",
            language="rus",
            ural=1,
        )

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub.return_value = mock_publ
        with pytest.raises(PublicationForbiddenError):
            await publication_service.validate_access(123, user_id=1)

    @pytest.mark.asyncio
    async def test_publication_not_found_raises_error(
        self,
        publication_service: PublicationService,
    ) -> None:
        """Test that validate_access raises PublicationNotFoundError when publication doesn't exist."""
        mock_user = User(user_id=1, items="123")

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub.return_value = None
        with pytest.raises(PublicationNotFoundError):
            await publication_service.validate_access(123, user_id=1)


# ============================================================================
# TESTS FOR _ADVANCE_QUEUE
# ============================================================================


class TestAdvanceQueue:
    @pytest.fixture(autouse=True, scope="function")
    def setup_mocks(self, publication_service: PublicationService):
        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as self.mock_get_user,
            patch(
                "service.publications.get_publication_expect", new_callable=AsyncMock
            ) as self.mock_get_pub_expect,
            patch.object(
                publication_service.actions,
                "log_publ_complete",
                new_callable=AsyncMock,
            ) as self.mock_log,
        ):
            yield

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "level,expected_level",
        [
            (ProcessingLevel.FULL, ProcessingLevel.FULL),
            (ProcessingLevel.SKIP, ProcessingLevel.SKIP),
        ],
    )
    async def test_advance_queue(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
        level: ProcessingLevel,
        expected_level: ProcessingLevel,
    ) -> None:
        """_advance_queue logs action, removes from queue, returns next."""
        mock_user = User(user_id=1, items="123|456|789")
        next_publ = Publication(
            publ_id=456,
            author="Author 2",
            name="Next Publication",
            type="A",
            year=2000,
            language="rus",
            ural=1,
        )

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub_expect.return_value = next_publ

        ip = "127.0.0.1" if level == ProcessingLevel.FULL else None
        result = await publication_service._advance_queue(
            token_user.user_id, 123, level, ip
        )

        self.mock_log.assert_called_once_with(1, expected_level, 123, ip)
        mock_session.commit.assert_not_called()
        assert result is not None
        assert result.publ_id == 456


# ============================================================================
# TESTS FOR SUBMIT
# ============================================================================


class TestSubmit:
    @pytest.fixture(autouse=True, scope="function")
    def setup_mocks(self, publication_service: PublicationService):
        with (
            patch.object(
                publication_service, "validate_access", new_callable=AsyncMock
            ) as self.mock_validate,
            patch.object(
                publication_service, "get_draft_record_ids", new_callable=AsyncMock
            ) as self.mock_drafts,
            patch.object(
                publication_service, "_advance_queue", new_callable=AsyncMock
            ) as self.mock_advance,
            patch.object(
                publication_service.actions,
                "log_publ_metadata",
                new_callable=AsyncMock,
            ) as self.mock_metadata,
            patch.object(
                publication_service.actions,
                "log_publ_comment",
                new_callable=AsyncMock,
            ) as self.mock_comment,
        ):
            yield

    @pytest.mark.asyncio
    async def test_submit_success(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """submit passes draft check, advances queue."""
        self.mock_drafts.return_value = []

        await publication_service.submit(
            token_user.user_id, 123, ProcessingLevel.FULL, None, None, None, None
        )

        self.mock_advance.assert_called_once_with(1, 123, ProcessingLevel.FULL, None)

    @pytest.mark.asyncio
    async def test_submit_raises_on_drafts(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """submit raises UnsubmittedRecordsError when drafts exist."""
        self.mock_drafts.return_value = ["draft-id-1", "draft-id-2"]

        with pytest.raises(UnsubmittedRecordsError) as exc:
            await publication_service.submit(
                token_user.user_id, 123, ProcessingLevel.FULL, None, None, None, None
            )

        assert exc.value.draft_record_ids == ["draft-id-1", "draft-id-2"]

    @pytest.mark.asyncio
    async def test_submit_logs_metadata(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """submit logs metadata when urals_scope or material_status provided."""
        self.mock_drafts.return_value = []

        await publication_service.submit(
            token_user.user_id,
            123,
            ProcessingLevel.FULL,
            "yes",
            "no",
            None,
            "127.0.0.1",
        )

        self.mock_metadata.assert_called_once_with(1, 123, "yes", "no", "127.0.0.1")

    @pytest.mark.asyncio
    async def test_submit_logs_comment(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """submit logs comment when comment provided."""
        self.mock_drafts.return_value = []

        await publication_service.submit(
            token_user.user_id,
            123,
            ProcessingLevel.FULL,
            None,
            None,
            "Looks good",
            "127.0.0.1",
        )

        self.mock_comment.assert_called_once_with(1, 123, "Looks good", "127.0.0.1")


# ============================================================================
# TESTS FOR _IS_INTERACTABLE
# ============================================================================


class TestIsInteractable:
    """Unit tests for PublicationService._is_interactable static method."""

    @pytest.mark.parametrize(
        "queue,publ_id,count,expected",
        [
            # Default count=1: only first item is interactable
            ([1, 2, 3], 1, 1, True),
            ([1, 2, 3], 2, 1, False),
            ([1, 2, 3], 3, 1, False),
            # Count=2: first two items are interactable
            ([1, 2, 3], 1, 2, True),
            ([1, 2, 3], 2, 2, True),
            ([1, 2, 3], 3, 2, False),
            # Count=0: any item in queue is interactable
            ([1, 2, 3], 1, 0, True),
            ([1, 2, 3], 2, 0, True),
            ([1, 2, 3], 3, 0, True),
            # Item not in queue
            ([1, 2, 3], 4, 1, False),
            ([1, 2, 3], 4, 2, False),
            ([1, 2, 3], 4, 0, False),
            # Empty queue
            ([], 1, 1, False),
            ([], 1, 0, False),
            # Single item queue
            ([42], 42, 1, True),
            ([42], 42, 5, True),
        ],
    )
    def test_is_interactable(
        self, queue: list[int], publ_id: int, count: int, expected: bool
    ) -> None:
        """Test _is_interactable with various queue configurations."""
        with patch("service.publications.settings") as mock_settings:
            mock_settings.INTERACTABLE_QUEUE_COUNT = count
            result = PublicationService._is_interactable(publ_id, queue)
            assert result is expected
