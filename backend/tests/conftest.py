import os
from collections.abc import AsyncGenerator, Callable
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt as pyjwt
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient, Cookies
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool
from testcontainers.postgres import PostgresContainer

from core.config import settings
from core.model import Base
from schema.jwt import Token


@pytest.fixture(scope="session")
async def db_engine():
    if os.getenv("TEST_DB"):
        pg = PostgresContainer("postgres:15-alpine")
        pg.start()

        url = pg.get_connection_url().replace(
            "postgresql+psycopg2", "postgresql+asyncpg"
        )
    else:
        url = str(settings.DB_URL)

    engine = create_async_engine(
        url, echo=False, pool_pre_ping=True, poolclass=NullPool
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture(scope="function")
async def session_maker(
    db_engine: AsyncEngine,
) -> AsyncGenerator[Callable[[], AsyncSession]]:
    maker = async_sessionmaker(
        bind=db_engine, class_=AsyncSession, expire_on_commit=False
    )

    yield maker

    async with maker() as session:
        await session.execute(
            text(
                "TRUNCATE TABLE users, publs, event_records, actions RESTART IDENTITY CASCADE"
            )
        )
        await session.commit()


@pytest.fixture(scope="function")
def session(
    session_maker: Callable[[], AsyncSession],
) -> AsyncSession:
    return session_maker()


@pytest_asyncio.fixture(scope="function")
async def seed_data(
    session: AsyncSession,
    test_users,
):
    """Truncate and seed test data for each test."""
    from core.model import EventRecord, Publ, User
    from core.security import get_password_hash

    user_data = test_users[0]

    user = User(
        user_id=user_data["user_id"],
        name=user_data["username"],
        tlg_name=user_data["username"],
        tlg_username=user_data["username"],
        hash=get_password_hash(user_data["password"]),
        items="1",
        publ_id=1,
    )
    session.add(user)

    publ = Publ(id=1, name="Test Publ")
    session.add(publ)
    await session.flush()

    now = datetime.now(UTC).replace(tzinfo=None)

    record_ids = []
    records = [
        EventRecord(
            id=uuid4(),
            user_id=user_data["user_id"],
            publ_id=1,
            type="rec_ok",
            genus="Testus",
            latitude=55.5,
            longitude=37.5,
            created_at=now,
            updated_at=now,
        ),
        EventRecord(
            id=uuid4(),
            user_id=user_data["user_id"],
            publ_id=1,
            type="rec_ok",
            genus="Testus",
            latitude=55.6,
            longitude=37.6,
            created_at=now,
            updated_at=now,
        ),
        EventRecord(
            id=uuid4(),
            user_id=user_data["user_id"],
            publ_id=1,
            type="rec_fail",
            created_at=now,
            updated_at=now,
        ),
    ]
    for record in records:
        session.add(record)
        record_ids.append(str(record.id))

    await session.commit()
    yield {"record_ids": record_ids}


@pytest_asyncio.fixture
async def async_client(session_maker: Callable[[], AsyncSession]):
    from app import app
    from core.database import get_session

    original = app.dependency_overrides.get(get_session, None)

    async def _maker():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_session] = _maker
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


@pytest.fixture(scope="session")
def test_users():
    return [
        {"user_id": 1, "username": "testuser1", "password": "password1"},
    ]


def create_test_token(user_id: int, username: str, token_type: str) -> str:
    if token_type == "access":
        expires = datetime.now(UTC) + timedelta(minutes=30)
    else:
        expires = datetime.now(UTC) + timedelta(days=30)

    payload = Token(sub=str(user_id), username=username, type=token_type, exp=expires)
    return pyjwt.encode(
        payload.model_dump(),
        settings.JWT_SECRET.get_secret_value(),
        algorithm="HS256",
    )


@pytest.fixture(scope="session")
def auth_token():
    return {
        "access_token": create_test_token(1, "testuser1", "access"),
        "refresh_token": create_test_token(1, "testuser1", "refresh"),
    }
