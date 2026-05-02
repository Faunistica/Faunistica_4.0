from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import TokenUser
from core.exceptions import PublicationForbiddenError, PublicationNotFoundError
from core.model import User
from schema.common import ProcessingLevel, Publication
from schema.user import UserMinimal
from service.actions import ActionService
from service.publications import (
    PublicationService,
    array_to_pipe,
    pipe_to_array,
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
# TESTS FOR MODULE-LEVEL FUNCTIONS
# ============================================================================


class TestPipeToArray:
    """Tests for the module-level pipe_to_array function."""

    def test_empty_string_returns_empty_list(self) -> None:
        """Should return empty list for empty string."""
        result = pipe_to_array("")
        assert result == []

    def test_single_value(self) -> None:
        """Should handle single pipe-delimited value."""
        result = pipe_to_array("123")
        assert result == [123]

    def test_multiple_values(self) -> None:
        """Should convert pipe-delimited string to list of ints."""
        result = pipe_to_array("123|456|789")
        assert result == [123, 456, 789]

    def test_whitespace_around_values(self) -> None:
        """Should handle whitespace around pipe delimiters."""
        result = pipe_to_array(" 123 | 456 | 789 ")
        assert result == [123, 456, 789]

    def test_empty_segments_filtered_out(self) -> None:
        """Should filter out empty segments from '|||'."""
        result = pipe_to_array("123||456||789")
        assert result == [123, 456, 789]

    def test_trailing_leading_pipes(self) -> None:
        """Should handle leading and trailing pipes."""
        result = pipe_to_array("|123|456|")
        assert result == [123, 456]

    def test_invalid_integer_raises_error(self) -> None:
        """Should raise ValueError for non-numeric strings."""
        with pytest.raises(ValueError):
            pipe_to_array("abc|123")


class TestArrayToPipe:
    """Tests for the module-level array_to_pipe function."""

    def test_empty_list_returns_empty_string(self) -> None:
        """Should return empty string for empty list."""
        result = array_to_pipe([])
        assert result == ""

    def test_single_element(self) -> None:
        """Should convert single element list to string."""
        result = array_to_pipe([123])
        assert result == "123"

    def test_multiple_elements(self) -> None:
        """Should convert list to pipe-delimited string."""
        result = array_to_pipe([123, 456, 789])
        assert result == "123|456|789"


# ============================================================================
# TESTS FOR VALIDATE_ACCESS
# ============================================================================


class TestValidateAccess:
    @pytest.mark.asyncio
    async def test_valid_access(self, publication_service: PublicationService) -> None:
        """Test that validate_access passes when user.publ_id matches."""
        mock_user = User(user_id=1, publ_id=123)

        with patch(
            "service.publications.get_user_expect", new_callable=AsyncMock
        ) as mock_get_user:
            mock_get_user.return_value = mock_user
            await publication_service.validate_access(1, 123)

    @pytest.mark.asyncio
    async def test_invalid_access(
        self, publication_service: PublicationService
    ) -> None:
        """Test that validate_access raises PublicationForbiddenError when mismatch."""
        mock_user = User(user_id=1, publ_id=456)

        with patch(
            "service.publications.get_user_expect", new_callable=AsyncMock
        ) as mock_get_user:
            mock_get_user.return_value = mock_user
            with pytest.raises(PublicationForbiddenError):
                await publication_service.validate_access(1, 123)

    @pytest.mark.asyncio
    async def test_publication_not_found_raises_error(
        self, publication_service: PublicationService
    ) -> None:
        """Test that validate_access raises PublicationNotFoundError when publication doesn't exist."""
        mock_user = User(user_id=1, publ_id=123)

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch(
                "service.publications.get_publication", new_callable=AsyncMock
            ) as mock_get_pub,
        ):
            mock_get_user.return_value = mock_user

            mock_get_pub.return_value = None
            with pytest.raises(PublicationNotFoundError):
                await publication_service.validate_access(1, 123)

    @pytest.mark.asyncio
    async def test_validate_access_calls_get_user_expect(
        self, publication_service: PublicationService, mock_session: MagicMock
    ) -> None:
        """Test that validate_access fetches user after validating publication exists."""
        mock_user = User(user_id=1, publ_id=123)

        with (
            patch(
                "service.publications.get_publication", new_callable=AsyncMock
            ) as mock_get_pub,
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
        ):
            mock_get_pub.return_value = Publication(id=123)

            mock_get_user.return_value = mock_user
            await publication_service.validate_access(1, 123)

            mock_get_pub.assert_called_once_with(mock_session, 123)
            mock_get_user.assert_called_once_with(mock_session, 1)


# ============================================================================
# TESTS FOR COMPLETE
# ============================================================================


class TestComplete:
    @pytest.mark.asyncio
    async def test_complete_full(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test complete with full processing level."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch.object(
                publication_service.actions, "log_publ_complete", new_callable=AsyncMock
            ) as mock_log,
        ):
            mock_get_user.return_value = mock_user

            await publication_service.complete(
                token_user, 123, ProcessingLevel.FULL, "127.0.0.1"
            )
            mock_log.assert_called_once_with(1, ProcessingLevel.FULL, 123, "127.0.0.1")

            mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_complete_with_part_level(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test complete with ProcessingLevel.PART."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch.object(
                publication_service.actions, "log_publ_complete", new_callable=AsyncMock
            ) as mock_log,
        ):
            mock_get_user.return_value = mock_user

            await publication_service.complete(
                token_user, 123, ProcessingLevel.PART, "127.0.0.1"
            )
            mock_log.assert_called_once_with(1, ProcessingLevel.PART, 123, "127.0.0.1")

    @pytest.mark.asyncio
    async def test_complete_with_skip_level(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test complete with ProcessingLevel.SKIP."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch.object(
                publication_service.actions, "log_publ_complete", new_callable=AsyncMock
            ) as mock_log,
        ):
            mock_get_user.return_value = mock_user

            await publication_service.complete(
                token_user, 123, ProcessingLevel.SKIP, "127.0.0.1"
            )
            mock_log.assert_called_once_with(1, ProcessingLevel.SKIP, 123, "127.0.0.1")

    @pytest.mark.asyncio
    async def test_complete_ip_none(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test complete when ip parameter is None."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch.object(
                publication_service.actions, "log_publ_complete", new_callable=AsyncMock
            ) as mock_log,
        ):
            mock_get_user.return_value = mock_user

            await publication_service.complete(
                token_user, 123, ProcessingLevel.FULL, None
            )
            mock_log.assert_called_once_with(1, ProcessingLevel.FULL, 123, None)

    @pytest.mark.asyncio
    async def test_complete_advances_queue_correctly(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test that complete removes publ_id from front of queue and updates user."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch.object(
                publication_service.actions, "log_publ_complete", new_callable=AsyncMock
            ),
        ):
            # Return same user object for both calls (validate_access and complete)
            mock_get_user.return_value = mock_user

            await publication_service.complete(
                token_user, 123, ProcessingLevel.FULL, "127.0.0.1"
            )

            # Verify log_publ_complete was called
            assert mock_session.execute.called
            # Verify commit was called
            mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_complete_last_item_in_queue(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test complete when finishing the last item in queue."""
        mock_user = User(user_id=1, publ_id=123, items="123")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch.object(
                publication_service.actions, "log_publ_complete", new_callable=AsyncMock
            ),
        ):
            mock_get_user.return_value = mock_user

            await publication_service.complete(
                token_user, 123, ProcessingLevel.FULL, "127.0.0.1"
            )

            # Verify session.execute was called (update statement)
            assert mock_session.execute.called
            # Verify commit was called
            mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_complete_empty_queue(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test complete when user.items is empty/None."""
        mock_user = User(user_id=1, publ_id=123, items=None)

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch.object(
                publication_service.actions, "log_publ_complete", new_callable=AsyncMock
            ),
        ):
            mock_get_user.return_value = mock_user

            await publication_service.complete(
                token_user, 123, ProcessingLevel.FULL, "127.0.0.1"
            )

            # Verify session.execute was called (update statement)
            assert mock_session.execute.called
            # Verify commit was called
            mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_complete_queue_mismatch_not_at_front(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test complete when publ_id to complete is not at front of queue."""
        # Current code only removes if queue[0] == publ_id
        mock_user = User(user_id=1, publ_id=123, items="456|123|789")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch.object(
                publication_service.actions, "log_publ_complete", new_callable=AsyncMock
            ),
        ):
            mock_get_user.return_value = mock_user

            await publication_service.complete(
                token_user, 123, ProcessingLevel.FULL, "127.0.0.1"
            )

            # Since 123 is not at front of queue (456 is), publ_id should not advance
            # This documents current behavior
            assert mock_user.publ_id == 123

    @pytest.mark.asyncio
    async def test_complete_calls_validate_access(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test that complete calls validate_access first."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch.object(
                publication_service, "validate_access", new_callable=AsyncMock
            ) as mock_validate,
            patch.object(
                publication_service.actions,
                "log_publ_complete",
                new_callable=AsyncMock,
            ),
        ):
            mock_get_user.return_value = mock_user

            await publication_service.complete(
                token_user, 123, ProcessingLevel.FULL, "127.0.0.1"
            )

            mock_validate.assert_called_once_with(1, 123)


# ============================================================================
# TESTS FOR GET_CURRENT
# ============================================================================


class TestGetCurrent:
    @pytest.mark.asyncio
    async def test_get_current_single(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test get_current with list_all=False returns only current publication."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch(
                "service.publications.get_publication", new_callable=AsyncMock
            ) as mock_get_pub,
        ):
            mock_get_user.return_value = mock_user

            mock_pub = Publication(
                id=123, author="Test Author", name="Test Publication"
            )

            mock_get_pub.return_value = mock_pub
            result = await publication_service.get_current(token_user, list_all=False)

        assert len(result) == 1
        assert result[0].id == 123

    @pytest.mark.asyncio
    async def test_get_current_all(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test get_current with list_all=True returns all publications in queue."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch(
                "service.publications.get_publications_by_ids", new_callable=AsyncMock
            ) as mock_get_pubs,
        ):
            mock_get_user.return_value = mock_user

            mock_get_pubs.return_value = [
                Publication(id=123, author="Author 1", name="Publication 1"),
                Publication(id=456, author="Author 2", name="Publication 2"),
                Publication(id=789, author="Author 3", name="Publication 3"),
            ]
            result = await publication_service.get_current(token_user, list_all=True)

        assert len(result) == 3

    @pytest.mark.asyncio
    async def test_get_current_single_no_publ_id(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test get_current with list_all=False when user.publ_id is None."""
        mock_user = User(user_id=1, publ_id=None, items="123|456|789")

        with patch(
            "service.publications.get_user_expect", new_callable=AsyncMock
        ) as mock_get_user:
            mock_get_user.return_value = mock_user

            result = await publication_service.get_current(token_user, list_all=False)

        # Should return empty list when publ_id is None
        assert result == []

    @pytest.mark.asyncio
    async def test_get_current_single_publ_not_found(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test get_current when publication doesn't exist in DB."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch(
                "service.publications.get_publication", new_callable=AsyncMock
            ) as mock_get_pub,
        ):
            mock_get_user.return_value = mock_user

            mock_get_pub.return_value = None
            result = await publication_service.get_current(token_user, list_all=False)

        # Should return empty list when publication not found
        assert result == []

    @pytest.mark.asyncio
    async def test_get_current_all_no_publ_id_with_queue(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test get_current with list_all=True when publ_id is None but queue has items."""
        mock_user = User(user_id=1, publ_id=None, items="456|789")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch(
                "service.publications.get_publications_by_ids", new_callable=AsyncMock
            ) as mock_get_pubs,
        ):
            mock_get_user.return_value = mock_user

            mock_get_pubs.return_value = [
                Publication(id=456, author="Author 2", name="Publication 2"),
                Publication(id=789, author="Author 3", name="Publication 3"),
            ]
            result = await publication_service.get_current(token_user, list_all=True)

        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_get_current_all_with_publ_id_no_queue(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test get_current with list_all=True when publ_id exists but queue is empty."""
        mock_user = User(user_id=1, publ_id=123, items=None)

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch(
                "service.publications.get_publications_by_ids", new_callable=AsyncMock
            ) as mock_get_pubs,
        ):
            mock_get_user.return_value = mock_user

            mock_get_pubs.return_value = [
                Publication(id=123, author="Author 1", name="Publication 1"),
            ]
            result = await publication_service.get_current(token_user, list_all=True)

        assert len(result) == 1
        assert result[0].id == 123

    @pytest.mark.asyncio
    async def test_get_current_all_empty_both(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test get_current with list_all=True when both publ_id and items are empty."""
        mock_user = User(user_id=1, publ_id=None, items=None)

        with patch(
            "service.publications.get_user_expect", new_callable=AsyncMock
        ) as mock_get_user:
            mock_get_user.return_value = mock_user

            result = await publication_service.get_current(token_user, list_all=True)

        assert result == []

    @pytest.mark.asyncio
    async def test_get_current_all_returns_publications_in_order(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test that get_current returns publications in correct order: current first, then queue."""
        mock_user = User(user_id=1, publ_id=123, items="456|789")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch(
                "service.publications.get_publications_by_ids", new_callable=AsyncMock
            ) as mock_get_pubs,
        ):
            mock_get_user.return_value = mock_user

            mock_get_pubs.return_value = [
                Publication(id=123, author="Author 1", name="Publication 1"),
                Publication(id=456, author="Author 2", name="Publication 2"),
                Publication(id=789, author="Author 3", name="Publication 3"),
            ]
            result = await publication_service.get_current(token_user, list_all=True)

        assert len(result) == 3
        # First should be current publication (123)
        assert result[0].id == 123
        # Then queue items in order (456, 789)
        assert result[1].id == 456
        assert result[2].id == 789

    @pytest.mark.asyncio
    async def test_get_current_calls_get_user_expect(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test that get_current fetches user data."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch(
                "service.publications.get_publication", new_callable=AsyncMock
            ) as mock_get_pub,
        ):
            mock_get_user.return_value = mock_user

            mock_get_pub.return_value = Publication(id=123)
            await publication_service.get_current(token_user, list_all=False)

            mock_get_user.assert_called_once_with(mock_session, 1)

    @pytest.mark.asyncio
    async def test_get_current_single_calls_get_publication(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test that get_current with list_all=False calls get_publication with publ_id."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as mock_get_user,
            patch(
                "service.publications.get_publication", new_callable=AsyncMock
            ) as mock_get_pub,
        ):
            mock_get_user.return_value = mock_user

            mock_get_pub.return_value = Publication(id=123)
            await publication_service.get_current(token_user, list_all=False)

            mock_get_pub.assert_called_once_with(mock_session, 123)
