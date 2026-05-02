from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import TokenUser
from core.exceptions import PublicationForbiddernError
from core.model import User
from schema.common import ProcessingLevel, Publication
from schema.user import UserMinimal
from service.actions import ActionService
from service.publications import PublicationService


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
    # TokenUser is Annotated[UserMinimal, ...], so we use UserMinimal directly
    return UserMinimal(user_id=1, name="testuser")


class TestValidateAccess:
    @pytest.mark.asyncio
    async def test_valid_access(
        self, publication_service: PublicationService, mock_session: MagicMock
    ) -> None:
        """Test that validate_access passes when user.publ_id matches."""
        mock_user = User(user_id=1, publ_id=123)

        with patch(
            "service.publications.get_user_expect", new_callable=AsyncMock
        ) as mock_get_user:
            mock_get_user.return_value = mock_user
            await publication_service.validate_access(1, 123)

    @pytest.mark.asyncio
    async def test_invalid_access(
        self, publication_service: PublicationService, mock_session: MagicMock
    ) -> None:
        """Test that validate_access raises PublicationForbiddernError when mismatch."""
        mock_user = User(user_id=1, publ_id=456)

        with patch(
            "service.publications.get_user_expect", new_callable=AsyncMock
        ) as mock_get_user:
            mock_get_user.return_value = mock_user
            with pytest.raises(PublicationForbiddernError):
                await publication_service.validate_access(1, 123)


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

        with patch(
            "service.publications.get_user_expect", new_callable=AsyncMock
        ) as mock_get_user:
            mock_get_user.return_value = mock_user

            with patch.object(
                publication_service.actions, "log_publ_complete", new_callable=AsyncMock
            ) as mock_log:
                await publication_service.complete(
                    token_user, 123, ProcessingLevel.FULL, "127.0.0.1"
                )
                mock_log.assert_called_once_with(
                    1, ProcessingLevel.FULL, 123, "127.0.0.1"
                )

            mock_session.commit.assert_called_once()


class TestGetCurrent:
    @pytest.mark.asyncio
    async def test_get_current_single(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test get_current with list_all=False returns only current publication."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        with patch(
            "service.publications.get_user_expect", new_callable=AsyncMock
        ) as mock_get_user:
            mock_get_user.return_value = mock_user

            mock_pub = Publication(
                id=123, author="Test Author", name="Test Publication"
            )
            with patch(
                "service.publications.get_publication", new_callable=AsyncMock
            ) as mock_get_pub:
                mock_get_pub.return_value = mock_pub
                result = await publication_service.get_current(
                    token_user, list_all=False
                )

        assert len(result) == 1
        assert result[0].id == 123

    @pytest.mark.asyncio
    async def test_get_current_all(
        self,
        publication_service: PublicationService,
        mock_session: MagicMock,
        token_user: TokenUser,
    ) -> None:
        """Test get_current with list_all=True returns all publications in queue."""
        mock_user = User(user_id=1, publ_id=123, items="123|456|789")

        with patch(
            "service.publications.get_user_expect", new_callable=AsyncMock
        ) as mock_get_user:
            mock_get_user.return_value = mock_user

            with patch(
                "service.publications.get_publications_by_ids", new_callable=AsyncMock
            ) as mock_get_pubs:
                mock_get_pubs.return_value = [
                    Publication(id=123, author="Author 1", name="Publication 1"),
                    Publication(id=456, author="Author 2", name="Publication 2"),
                    Publication(id=789, author="Author 3", name="Publication 3"),
                ]
                result = await publication_service.get_current(
                    token_user, list_all=True
                )

        assert len(result) == 3


class TestPipeConversion:
    def test_pipe_to_array_multiple(self) -> None:
        service = PublicationService(MagicMock(), MagicMock())
        assert service._pipe_to_array("123|456|789") == [123, 456, 789]

    def test_pipe_to_array_empty(self) -> None:
        service = PublicationService(MagicMock(), MagicMock())
        assert service._pipe_to_array("") == []

    def test_pipe_to_array_single(self) -> None:
        service = PublicationService(MagicMock(), MagicMock())
        assert service._pipe_to_array("123") == [123]

    def test_array_to_pipe_multiple(self) -> None:
        service = PublicationService(MagicMock(), MagicMock())
        assert service._array_to_pipe([123, 456, 789]) == "123|456|789"

    def test_array_to_pipe_empty(self) -> None:
        service = PublicationService(MagicMock(), MagicMock())
        assert service._array_to_pipe([]) == ""
