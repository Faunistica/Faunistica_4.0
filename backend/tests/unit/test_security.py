import hashlib
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

import jwt as pyjwt
import pytest
from fastapi import HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.exceptions import AdminOnlyError
from core.security import (
    PasswordCheckResult,
    check_admin,
    check_password,
    create_access_token,
    create_refresh_token,
    get_jwt_user,
    get_password_hash,
    set_response_token_cookies,
    validate_user_id,
    verify_token,
)
from schema.jwt import TokenPayload


class TestPasswordCheckResult:
    def test_dataclass_fields(self):
        result = PasswordCheckResult(is_valid=True, new_hash=None, hash_type="argon2")
        assert result.is_valid is True
        assert result.new_hash is None
        assert result.hash_type == "argon2"

    def test_dataclass_instantiation(self):
        result = PasswordCheckResult(is_valid=False, new_hash="hash", hash_type="md5")
        assert result.is_valid is False
        assert result.new_hash == "hash"
        assert result.hash_type == "md5"


class TestGetPasswordHash:
    def test_returns_argon2_hash(self):
        hash_val = get_password_hash("test_password")
        assert hash_val.startswith("$argon2")

    def test_same_password_different_hash(self):
        hash1 = get_password_hash("test_password")
        hash2 = get_password_hash("test_password")
        assert hash1 != hash2

    def test_hash_verifies(self):
        password = "test_password_123"
        hash_val = get_password_hash(password)
        from core.security import pwd_hasher

        assert pwd_hasher.verify(hash_val, password) is True


class TestCheckPasswordArgon2:
    def test_valid_password(self):
        password = "test_password_123"
        argon2_hash = get_password_hash(password)

        result = check_password(password, argon2_hash)

        assert result.is_valid is True
        assert result.new_hash is None
        assert result.hash_type == "argon2"

    def test_invalid_password(self):
        password = "test_password_123"
        wrong_password = "wrong_password"
        argon2_hash = get_password_hash(password)

        result = check_password(wrong_password, argon2_hash)

        assert result.is_valid is False
        assert result.new_hash is None
        assert result.hash_type == "argon2"


class TestCheckPasswordMD5:
    def test_valid_password(self):
        password = "test_password_123"
        md5_hash = hashlib.md5(password.encode()).hexdigest()  # noqa: S324

        result = check_password(password, md5_hash)

        assert result.is_valid is True
        assert result.new_hash is not None
        assert result.new_hash.startswith("$argon2")
        assert result.hash_type == "md5"

    def test_invalid_password(self):
        password = "test_password_123"
        wrong_password = "wrong_password"
        md5_hash = hashlib.md5(password.encode()).hexdigest()  # noqa: S324

        result = check_password(wrong_password, md5_hash)

        assert result.is_valid is False
        assert result.new_hash is None
        assert result.hash_type == "md5"

    def test_timing_safe_comparison(self):
        password = "test_password_123"
        md5_hash = hashlib.md5(password.encode()).hexdigest()  # noqa: S324

        valid_result = check_password(password, md5_hash)
        invalid_result = check_password("wrong_password", md5_hash)

        assert valid_result.is_valid is True
        assert invalid_result.is_valid is False


class TestCheckPasswordUnrecognizedHash:
    def test_unrecognized_hash_raises_value_error(self):
        password = "test_password_123"
        bad_hash = "clearly_not_a_valid_hash_format!"

        with pytest.raises(ValueError, match="Unrecognized password hash format"):
            check_password(password, bad_hash)

    def test_short_hash_raises_value_error(self):
        password = "test_password_123"
        short_hash = "abc123"

        with pytest.raises(ValueError, match="Unrecognized password hash format"):
            check_password(password, short_hash)

    def test_empty_hash_raises_value_error(self):
        password = "test_password_123"

        with pytest.raises(ValueError, match="Unrecognized password hash format"):
            check_password(password, "")


class TestCreateAccessToken:
    def test_returns_valid_jwt(self):
        payload = TokenPayload(sub="1", username="testuser")
        token = create_access_token(payload)

        assert isinstance(token, str)
        decoded = pyjwt.decode(token, options={"verify_signature": False})
        assert decoded["sub"] == "1"
        assert decoded["username"] == "testuser"
        assert decoded["type"] == "access"
        assert "exp" in decoded

    def test_token_expiry_is_correct(self):
        payload = TokenPayload(sub="1", username="testuser")
        token = create_access_token(payload)

        decoded = pyjwt.decode(token, options={"verify_signature": False})
        expected_exp = datetime.now(UTC) + timedelta(
            seconds=settings.ACCESS_TOKEN_EXPIRE_SECONDS
        )
        actual_exp = datetime.fromtimestamp(decoded["exp"], tz=UTC)
        assert abs((actual_exp - expected_exp).total_seconds()) < 5


class TestCreateRefreshToken:
    def test_returns_valid_jwt(self):
        payload = TokenPayload(sub="1", username="testuser")
        token = create_refresh_token(payload)

        assert isinstance(token, str)
        decoded = pyjwt.decode(token, options={"verify_signature": False})
        assert decoded["sub"] == "1"
        assert decoded["username"] == "testuser"
        assert decoded["type"] == "refresh"
        assert "exp" in decoded

    def test_token_expiry_is_correct(self):
        payload = TokenPayload(sub="1", username="testuser")
        token = create_refresh_token(payload)

        decoded = pyjwt.decode(token, options={"verify_signature": False})
        expected_exp = datetime.now(UTC) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        actual_exp = datetime.fromtimestamp(decoded["exp"], tz=UTC)
        assert abs((actual_exp - expected_exp).total_seconds()) < 5


class TestSetResponseTokenCookies:
    def test_sets_access_and_refresh_cookies(self):
        response = Response()
        payload = TokenPayload(sub="1", username="testuser")

        set_response_token_cookies(response, payload)

        cookies = response.headers.getlist("set-cookie")
        assert len(cookies) == 2
        cookie_text = " ".join(cookies)
        assert "access_token" in cookie_text
        assert "refresh_token" in cookie_text
        assert "HttpOnly" in cookie_text
        assert "strict" in cookie_text.lower()

    def test_cookies_have_correct_paths(self):
        response = Response()
        payload = TokenPayload(sub="1", username="testuser")

        set_response_token_cookies(response, payload)

        cookies = response.headers.getlist("set-cookie")
        for cookie in cookies:
            assert "Path=/api" in cookie


class TestVerifyToken:
    def test_valid_access_token(self):
        payload = TokenPayload(sub="1", username="testuser")
        token = create_access_token(payload)

        result = verify_token(token)

        assert result.sub == "1"
        assert result.username == "testuser"
        assert result.type == "access"

    def test_valid_refresh_token(self):
        payload = TokenPayload(sub="1", username="testuser")
        token = create_refresh_token(payload)

        result = verify_token(token)

        assert result.sub == "1"
        assert result.type == "refresh"

    def test_expired_token_raises_403(self):
        # Create an already-expired token
        payload = TokenPayload(sub="1", username="testuser")
        exp = datetime.now(UTC) - timedelta(hours=1)
        data = {
            "sub": payload.sub,
            "username": payload.username,
            "type": "access",
            "exp": exp,
        }
        token = pyjwt.encode(
            data, settings.JWT_SECRET.get_secret_value(), algorithm="HS256"
        )

        with pytest.raises(HTTPException) as exc_info:
            verify_token(token)
        assert exc_info.value.status_code == 403

    def test_invalid_token_raises_403(self):
        with pytest.raises(HTTPException) as exc_info:
            verify_token("not_a_valid_jwt")
        assert exc_info.value.status_code == 403

    def test_wrong_signature_raises_403(self):
        payload = TokenPayload(sub="1", username="testuser")
        token = create_access_token(payload)
        # Tamper with token
        tampered = token[:-5] + "XXXXX"

        with pytest.raises(HTTPException) as exc_info:
            verify_token(tampered)
        assert exc_info.value.status_code == 403


class TestGetJwtUser:
    def test_valid_token_returns_user(self):
        payload = TokenPayload(sub="1", username="testuser")
        token = create_access_token(payload)

        request = MagicMock(spec=Request)
        request.cookies = {"access_token": token}

        user = get_jwt_user(request)

        from schema.user import UserMinimal

        assert isinstance(user, UserMinimal)
        assert user.user_id == 1
        assert user.name == "testuser"

    def test_missing_token_raises_403(self):
        request = MagicMock(spec=Request)
        request.cookies = {}

        with pytest.raises(HTTPException) as exc_info:
            get_jwt_user(request)
        assert exc_info.value.status_code == 403

    def test_refresh_token_as_access_raises_403(self):
        payload = TokenPayload(sub="1", username="testuser")
        token = create_refresh_token(payload)

        request = MagicMock(spec=Request)
        request.cookies = {"access_token": token}

        with pytest.raises(HTTPException) as exc_info:
            get_jwt_user(request)
        assert exc_info.value.status_code == 403

    def test_invalid_sub_raises_403(self):
        # Create token with non-numeric sub
        data = {
            "sub": "not_a_number",
            "username": "testuser",
            "type": "access",
            "exp": datetime.now(UTC) + timedelta(minutes=30),
        }
        token = pyjwt.encode(
            data, settings.JWT_SECRET.get_secret_value(), algorithm="HS256"
        )

        request = MagicMock(spec=Request)
        request.cookies = {"access_token": token}

        with pytest.raises(HTTPException) as exc_info:
            get_jwt_user(request)
        assert exc_info.value.status_code == 403


class TestCheckAdmin:
    def test_always_raises_admin_only_error(self):
        with pytest.raises(AdminOnlyError):
            check_admin(MagicMock(spec=AsyncSession), 1)


class TestValidateUserId:
    def test_matching_ids_returns_id(self):
        result = validate_user_id(1, 1)
        assert result == 1

    def test_mismatching_ids_raises_403(self):
        with pytest.raises(HTTPException) as exc_info:
            validate_user_id(1, 2)
        assert exc_info.value.status_code == 403
        assert "Access denied" in exc_info.value.detail
