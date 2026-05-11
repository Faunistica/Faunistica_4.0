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
        result = await publication_service.complete(token_user.user_id, 123, level, ip)

        self.mock_log.assert_called_once_with(1, expected_level, 123, ip)
        mock_session.commit.assert_called_once()
        assert result is not None
        assert result.publ_id == 456
