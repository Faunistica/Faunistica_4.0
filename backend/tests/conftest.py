import asyncio
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import jwt as pyjwt
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient, Cookies
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from testcontainers.postgres import PostgresContainer

from core.config import settings
from core.model import Base
from schemas.jwt import TokenPayload

_postgres_container = None
_db_engine = None


def get_postgres():
    global _postgres_container
    if _postgres_container is None:
        _postgres_container = PostgresContainer("postgres:16")
        _postgres_container.start()
    return _postgres_container


def get_db_engine():
    global _db_engine
    if _db_engine is None:
        from sqlalchemy import URL

        pg = get_postgres()
        url = URL.create(
            drivername="postgresql+asyncpg",
            username=pg.username,
            password=pg.password,
            host=pg.get_container_host_ip(),
            port=pg.port,
            database=pg.dbname,
        )
        _db_engine = create_async_engine(
            url, echo=False, pool_pre_ping=True, poolclass=NullPool
        )

        async def init():
            async with _db_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

        asyncio.run(init())

    return _db_engine


@pytest.fixture(scope="session")
def db_engine():
    return get_db_engine()


@pytest.fixture(scope="function")
def db_session_maker(db_engine):
    return async_sessionmaker(
        bind=db_engine, class_=AsyncSession, expire_on_commit=False
    )


@pytest_asyncio.fixture
async def async_client(db_session_maker):
    from app import app
    from core.database import get_session

    maker = db_session_maker
    original = app.dependency_overrides.get(get_session, None)

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        async with maker() as session:
            try:
                yield session
            finally:
                await session.close()

    app.dependency_overrides[get_session] = override_get_session
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            follow_redirects=True,
            cookies=Cookies(),
        ) as client:
            yield client
    finally:
        if original:
            app.dependency_overrides[get_session] = original
        else:
            del app.dependency_overrides[get_session]


@pytest.fixture
def test_users():
    return [
        {"id": 1, "username": "testuser1", "password": "password1"},
    ]


def create_test_token(user_id: int, username: str, token_type: str) -> str:
    if token_type == "access":
        expires = datetime.now(UTC) + timedelta(minutes=30)
    else:
        expires = datetime.now(UTC) + timedelta(days=30)

    payload = TokenPayload(sub=str(user_id), username=username)
    token_data = {**payload.model_dump(), "type": token_type, "exp": expires}
    return pyjwt.encode(
        token_data,
        settings.JWT_SECRET.get_secret_value(),
        algorithm="HS256",
    )


@pytest.fixture
def auth_token():
    return {
        "access_token": create_test_token(1, "testuser1", "access"),
        "refresh_token": create_test_token(1, "testuser1", "refresh"),
    }

