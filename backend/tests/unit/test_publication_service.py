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

        await publication_service.validate_access(123, user_id=1)

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
            await publication_service.validate_access(123, user_id=1)

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
            await publication_service.validate_access(123, user_id=1)


# ============================================================================
# TESTS FOR COMPLETE
# ============================================================================


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
    @pytest.mark.parametrize(
        "level,expected_level",
        [
            (ProcessingLevel.FULL, ProcessingLevel.FULL),
            (ProcessingLevel.SKIP, ProcessingLevel.SKIP),
        ],
    )
    async def test_complete(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
        level: ProcessingLevel,
        expected_level: ProcessingLevel,
    ) -> None:
        """Test complete with various processing levels."""
        mock_user = User(user_id=1, publ_id=123, items="456|789")
        next_publ = Publication(id=456, author="Author 2", name="Next Publication")

        self.mock_get_user.return_value = mock_user
        self.mock_get_pub_expect.return_value = next_publ

        ip = "127.0.0.1" if level == ProcessingLevel.FULL else None
        result = await publication_service.complete(token_user.user_id, 123, level, ip)

        self.mock_log.assert_called_once_with(1, expected_level, 123, ip)
        mock_session.commit.assert_called_once()
        assert result is not None
        assert result.id == 456

    @pytest.mark.asyncio
    async def test_complete_returns_none_when_queue_empty(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test that complete returns None when queue is empty after advancing."""
        mock_user = User(user_id=1, publ_id=123, items=None)

        self.mock_get_user.return_value = mock_user

        result = await publication_service.complete(
            token_user.user_id, 123, ProcessingLevel.FULL, "127.0.0.1"
        )

        assert result is None
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
        self.mock_get_pub_expect.return_value = Publication(id=456)

        await publication_service.complete(
            token_user.user_id, 123, ProcessingLevel.FULL, "127.0.0.1"
        )

        self.mock_validate.assert_called_once_with(123, user=mock_user)


# ============================================================================
# TESTS FOR GET_CURRENT
# ============================================================================


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
        self.mock_get_pub_expect.return_value = Publication(
            id=123, author="Test Author", name="Test Publication"
        )

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
    @pytest.mark.parametrize(
        "publ_id,items,expected_len",
        [
            (None, "456|789", 2),
            (123, None, 1),
            (None, None, 0),
        ],
    )
    async def test_get_current_various_states(
        self,
        publication_service: PublicationService,
        token_user: TokenUser,
        publ_id: int | None,
        items: str | None,
        expected_len: int,
    ) -> None:
        """Test get_current with various publ_id and items combinations."""
        mock_user = User(user_id=1, publ_id=publ_id, items=items)

        self.mock_get_user.return_value = mock_user

        publications = []
        if publ_id:
            publications.append(
                Publication(id=publ_id, author="Author 1", name="Publication 1")
            )
        if items:
            publications.extend(
                [
                    Publication(id=456, author="Author 2", name="Publication 2"),
                    Publication(id=789, author="Author 3", name="Publication 3"),
                ]
            )
        self.mock_get_pubs.return_value = publications

        result = await publication_service.get_current(token_user, with_queue=True)
        assert len(result) == expected_len


# ============================================================================
# TESTS FOR ASSIGN_CURRENT
# ============================================================================


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
        self.mock_get_pub_expect.return_value = mock_publ
        result = await publication_service.assign_current(1)

        assert result is not None
        assert result.id == 123
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
        self.mock_get_pub_expect.return_value = Publication(
            id=456, author="Author 2", name="Publication 2"
        )

        result = await publication_service.assign_current(1)

        assert result is not None
        assert result.id == 456
        mock_session.execute.assert_not_called()

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "items",
        [None, ""],
    )
    async def test_assign_current_when_queue_empty(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        items: str | None,
    ) -> None:
        """Test assign_current returns None when queue is empty."""
        mock_user = User(user_id=1, publ_id=None, items=items)

        self.mock_get_user.return_value = mock_user

        result = await publication_service.assign_current(1)

        assert result is None
        mock_session.execute.assert_not_called()
