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


@pytest.mark.skip
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
        """Test that validate_access passes when user.publ_id matches."""
        mock_user = User(user_id=1, publ_id=123)
        mock_publ = Publication(id=123)

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub.return_value = mock_publ

        await publication_service.validate_access(1, 123)

    @pytest.mark.asyncio
    async def test_invalid_access(
        self, publication_service: PublicationService
    ) -> None:
        """Test that validate_access raises PublicationForbiddenError when mismatch."""
        mock_user = User(user_id=1, publ_id=456)
        mock_publ = Publication(id=123)

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub.return_value = mock_publ
        with pytest.raises(PublicationForbiddenError):
            await publication_service.validate_access(1, 123)

    @pytest.mark.asyncio
    async def test_publication_not_found_raises_error(
        self,
        publication_service: PublicationService,
    ) -> None:
        """Test that validate_access raises PublicationNotFoundError when publication doesn't exist."""
        mock_user = User(user_id=1, publ_id=123)

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub.return_value = None
        with pytest.raises(PublicationNotFoundError):
            await publication_service.validate_access(1, 123)

    @pytest.mark.asyncio
    async def test_validate_access_calls_get_user_expect(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
    ) -> None:
        """Test that validate_access fetches user after validating publication exists."""
        mock_user = User(user_id=1, publ_id=123)

        self.mock_get_pub.return_value = Publication(id=123)
        self.mock_get_user.return_value = mock_user

        await publication_service.validate_access(1, 123)

        self.mock_get_pub.assert_called_once_with(mock_session, 123)
        self.mock_get_user.assert_called_once_with(mock_session, 1)


# ============================================================================
# TESTS FOR COMPLETE
# ============================================================================


@pytest.mark.skip
class TestComplete:
    @pytest.fixture(autouse=True, scope="function")
    def setup_mocks(self, publication_service: PublicationService):
        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as self.mock_get_user,
            patch(
                "service.publications.get_publication", new_callable=AsyncMock
            ) as self.mock_get_pub,
            patch(
                "service.publications.get_publication_expect", new_callable=AsyncMock
            ) as self.mock_get_pub_expect,
            patch.object(
                publication_service, "validate_access", new_callable=AsyncMock
            ) as self.mock_validate,
            patch.object(
                publication_service.actions,
                "log_publ_complete",
                new_callable=AsyncMock,
            ) as self.mock_log,
        ):
            yield

    @pytest.mark.asyncio
    async def test_complete_full(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test complete with full processing level."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub.return_value = Publication(id=456)
        self.mock_get_pub_expect.return_value = Publication(id=456)

        result = await publication_service.complete(
            token_user.user_id, 123, ProcessingLevel.FULL, "127.0.0.1"
        )
        self.mock_log.assert_called_once_with(1, ProcessingLevel.FULL, 123, "127.0.0.1")

        mock_session.commit.assert_called_once()
        assert result is not None
        assert result.id == 456

    @pytest.mark.asyncio
    async def test_complete_with_part_level(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test complete with ProcessingLevel.PART."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub.return_value = Publication(id=456)
        self.mock_get_pub_expect.return_value = Publication(id=456)

        result = await publication_service.complete(
            token_user.user_id, 123, ProcessingLevel.SKIP, "127.0.0.1"
        )
        self.mock_log.assert_called_once_with(1, ProcessingLevel.SKIP, 123, "127.0.0.1")
        assert result is not None
        assert result.id == 456

    @pytest.mark.asyncio
    async def test_complete_ip_none(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test complete when ip parameter is None."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub.return_value = Publication(id=456)
        self.mock_get_pub_expect.return_value = Publication(id=456)

        result = await publication_service.complete(
            token_user.user_id, 123, ProcessingLevel.FULL, None
        )
        self.mock_log.assert_called_once_with(1, ProcessingLevel.FULL, 123, None)
        assert result is not None
        assert result.id == 456

    @pytest.mark.asyncio
    async def test_complete_advances_queue_correctly(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test that complete removes publ_id from front of queue and updates user."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        # Return same user object for both calls (validate_access and complete)
        self.mock_get_user.return_value = mock_user
        self.mock_get_pub.return_value = Publication(id=456)
        self.mock_get_pub_expect.return_value = Publication(id=456)

        result = await publication_service.complete(
            token_user.user_id, 123, ProcessingLevel.FULL, "127.0.0.1"
        )

        # Verify log_publ_complete was called
        assert mock_session.execute.called
        # Verify commit was called
        mock_session.commit.assert_called_once()
        # Verify next publication is returned
        assert result is not None
        assert result.id == 456

    @pytest.mark.asyncio
    async def test_complete_last_item_in_queue(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test complete when finishing the last item in queue."""
        mock_user = User(user_id=1, publ_id=123, items="123")

        self.mock_get_user.return_value = mock_user

        await publication_service.complete(
            token_user.user_id, 123, ProcessingLevel.FULL, "127.0.0.1"
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

        self.mock_get_user.return_value = mock_user

        await publication_service.complete(
            token_user.user_id, 123, ProcessingLevel.FULL, "127.0.0.1"
        )

        # Verify session.execute was called (update statement)
        assert mock_session.execute.called
        # Verify commit was called
        mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_complete_calls_validate_access(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test that complete calls validate_access first."""
        mock_user = User(user_id=1, publ_id=123, items="456|789")

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub.return_value = Publication(id=456)
        self.mock_get_pub_expect.return_value = Publication(id=456)

        await publication_service.complete(
            token_user.user_id, 123, ProcessingLevel.FULL, "127.0.0.1"
        )

        self.mock_validate.assert_called_once_with(1, 123)

    @pytest.mark.asyncio
    async def test_complete_returns_next_publication(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test that complete returns the next publication after advancing queue."""
        mock_user = User(user_id=1, publ_id=123, items="456|789")

        self.mock_get_user.return_value = mock_user

        # Mock get_publication to return the next publication (456)
        with patch(
            "service.publications.get_publication", new_callable=AsyncMock
        ) as mock_get_pub:
            mock_get_pub.return_value = Publication(
                id=456, author="Author 2", name="Next Publication"
            )
            result = await publication_service.complete(
                token_user.user_id, 123, ProcessingLevel.FULL, "127.0.0.1"
            )

        assert result is not None
        assert result.id == 456
        assert result.author == "Author 2"

    @pytest.mark.asyncio
    async def test_complete_returns_none_when_queue_empty(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test that complete returns None when queue is empty after advancing."""
        mock_user = User(user_id=1, publ_id=123)

        self.mock_get_user.return_value = mock_user

        # Mock get_publication to return None (no next publication)
        with patch(
            "service.publications.get_publication", new_callable=AsyncMock
        ) as mock_get_pub:
            mock_get_pub.return_value = None
            result = await publication_service.complete(
                token_user.user_id, 123, ProcessingLevel.FULL, "127.0.0.1"
            )

        assert result is None


# ============================================================================
# TESTS FOR GET_CURRENT
# ============================================================================


@pytest.mark.skip
class TestGetCurrent:
    @pytest.fixture(autouse=True, scope="function")
    def setup_mocks(self):
        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as self.mock_get_user,
            patch(
                "service.publications.get_publication", new_callable=AsyncMock
            ) as self.mock_get_pub,
            patch(
                "service.publications.get_publication_expect", new_callable=AsyncMock
            ) as self.mock_get_pub_expect,
            patch(
                "service.publications.get_publications_by_ids", new_callable=AsyncMock
            ) as self.mock_get_pubs,
        ):
            yield

    @pytest.mark.asyncio
    async def test_get_current_single(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test get_current with list_all=False returns only current publication."""
        mock_user = User(user_id=1, publ_id=123, items="456|789")

        self.mock_get_user.return_value = mock_user

        mock_pub = Publication(id=123, author="Test Author", name="Test Publication")

        self.mock_get_pub.return_value = mock_pub
        self.mock_get_pub_expect.return_value = mock_pub

        result = await publication_service.get_current(token_user, with_queue=False)

        assert len(result) == 1
        assert result[0].id == 123

    @pytest.mark.asyncio
    async def test_get_current_all(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test get_current with list_all=True returns all publications in queue."""
        mock_user = User(user_id=1, publ_id=123, items="456|789")

        self.mock_get_user.return_value = mock_user

        self.mock_get_pubs.return_value = [
            Publication(id=123, author="Author 1", name="Publication 1"),
            Publication(id=456, author="Author 2", name="Publication 2"),
            Publication(id=789, author="Author 3", name="Publication 3"),
        ]
        result = await publication_service.get_current(token_user, with_queue=True)

        assert len(result) == 3

    @pytest.mark.asyncio
    async def test_get_current_single_no_publ_id(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test get_current with list_all=False when user.publ_id is None."""
        mock_user = User(user_id=1, publ_id=None, items="456|789")

        self.mock_get_user.return_value = mock_user

        result = await publication_service.get_current(token_user, with_queue=False)

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
        mock_user = User(user_id=1, publ_id=123, items="456|789")

        self.mock_get_user.return_value = mock_user

        self.mock_get_pub.return_value = None
        result = await publication_service.get_current(token_user, with_queue=False)

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

        self.mock_get_user.return_value = mock_user

        self.mock_get_pubs.return_value = [
            Publication(id=456, author="Author 2", name="Publication 2"),
            Publication(id=789, author="Author 3", name="Publication 3"),
        ]
        result = await publication_service.get_current(token_user, with_queue=True)

        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_get_current_all_with_publ_id_no_queue(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test get_current with list_all=True when publ_id exists but queue is empty."""
        mock_user = User(user_id=1, publ_id=123, items=None)

        self.mock_get_user.return_value = mock_user

        self.mock_get_pubs.return_value = [
            Publication(id=123, author="Author 1", name="Publication 1"),
        ]
        result = await publication_service.get_current(token_user, with_queue=True)

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

        self.mock_get_user.return_value = mock_user

        result = await publication_service.get_current(token_user, with_queue=True)

        assert result == []

    @pytest.mark.asyncio
    async def test_get_current_all_returns_publications_in_order(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
    ) -> None:
        """Test that get_current returns publications in correct order: current first, then queue."""
        mock_user = User(user_id=1, publ_id=123, items="456|789")

        self.mock_get_user.return_value = mock_user

        self.mock_get_pubs.return_value = [
            Publication(id=123, author="Author 1", name="Publication 1"),
            Publication(id=456, author="Author 2", name="Publication 2"),
            Publication(id=789, author="Author 3", name="Publication 3"),
        ]
        result = await publication_service.get_current(token_user, with_queue=True)

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
        mock_user = User(user_id=1, publ_id=123, items="456|789")

        self.mock_get_user.return_value = mock_user

        self.mock_get_pub.return_value = Publication(id=123)
        self.mock_get_pub_expect.return_value = Publication(id=123)
        await publication_service.get_current(token_user, with_queue=False)

        self.mock_get_user.assert_called_once_with(mock_session, 1)

    @pytest.mark.asyncio
    async def test_get_current_single_calls_get_publication(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test that get_current with list_all=False calls get_publication with publ_id."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        self.mock_get_user.return_value = mock_user

        self.mock_get_pub_expect.return_value = Publication(id=123)
        await publication_service.get_current(token_user, with_queue=False)

        self.mock_get_pub_expect.assert_called_once_with(mock_session, 123)


# ============================================================================
# TESTS FOR ASSIGN_CURRENT
# ============================================================================


@pytest.mark.skip
class TestAssignCurrent:
    @pytest.fixture(autouse=True, scope="function")
    def setup_mocks(self, publication_service: PublicationService):
        with (
            patch(
                "service.publications.get_user_expect", new_callable=AsyncMock
            ) as self.mock_get_user,
            patch(
                "service.publications.get_publication", new_callable=AsyncMock
            ) as self.mock_get_pub,
            patch(
                "service.publications.get_publication_expect", new_callable=AsyncMock
            ) as self.mock_get_pub_expect,
        ):
            yield

    @pytest.mark.asyncio
    async def test_assign_current_when_none_assigned(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
    ) -> None:
        """Test assign_current assigns next publication from queue when publ_id is None."""
        mock_user = User(user_id=1, publ_id=None, items="123|456|789")
        mock_publ = Publication(id=123, author="Author 1", name="Publication 1")

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub.return_value = mock_publ
        self.mock_get_pub_expect.return_value = mock_publ
        result = await publication_service.assign_current(1)

        assert result is not None
        assert result.id == 123
        # Verify user's publ_id was updated
        assert mock_session.execute.called
        mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_assign_current_when_already_assigned(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
    ) -> None:
        """Test assign_current returns current publication when already assigned."""
        mock_user = User(user_id=1, publ_id=456, items="123|456|789")

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub.return_value = Publication(
            id=456, author="Author 2", name="Publication 2"
        )

        result = await publication_service.assign_current(1)

        assert result is not None
        assert result.id == 456
        # Verify user's publ_id was NOT updated (already assigned)
        mock_session.execute.assert_not_called()

    @pytest.mark.asyncio
    async def test_assign_current_when_queue_empty(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
    ) -> None:
        """Test assign_current returns None when queue is empty."""
        mock_user = User(user_id=1, publ_id=None, items=None)

        self.mock_get_user.return_value = mock_user

        result = await publication_service.assign_current(1)

        assert result is None
        mock_session.execute.assert_not_called()

    @pytest.mark.asyncio
    async def test_assign_current_when_queue_empty_string(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
    ) -> None:
        """Test assign_current returns None when items is empty string."""
        mock_user = User(user_id=1, publ_id=None, items="")

        self.mock_get_user.return_value = mock_user

        result = await publication_service.assign_current(1)

        assert result is None
        mock_session.execute.assert_not_called()

    @pytest.mark.asyncio
    async def test_assign_current_calls_get_user_expect(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
    ) -> None:
        """Test that assign_current fetches user data."""
        mock_user = User(user_id=1, publ_id=None, items="123|456")

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub.return_value = Publication(id=123)

        await publication_service.assign_current(1)

        self.mock_get_user.assert_called_once_with(mock_session, 1)
