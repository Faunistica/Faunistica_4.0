import os
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt as pyjwt
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient, Cookies
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from testcontainers.postgres import PostgresContainer

from core.config import settings
from schema.jwt import TokenPayload


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

    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def db_schema(db_engine):
    """Create all tables once per session."""
    from core.model import Base

    engine = db_engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="session")
def db_session_maker(db_engine, db_schema):
    return async_sessionmaker(
        bind=db_engine, class_=AsyncSession, expire_on_commit=False
    )


@pytest_asyncio.fixture(scope="session")
async def seed_data(db_engine, db_session_maker, test_users):
    """Truncate and seed test data for each test."""
    from core.model import EventRecord, Publ, User
    from core.security import get_password_hash

    engine = db_engine
    maker = db_session_maker
    user_data = test_users[0]

    async with engine.begin() as conn:
        await conn.execute(
            text(
                "TRUNCATE TABLE users, publs, event_records, actions RESTART IDENTITY CASCADE"
            )
        )

    async with maker() as session:
        user = User(
            user_id=user_data["user_id"],
            name=user_data["name"],
            tlg_name=user_data["name"],
            tlg_username=user_data["name"],
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


@pytest.fixture(scope="session")
def test_users():
    return [
        {"user_id": 1, "name": "testuser1", "password": "password1"},
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


@pytest.fixture(scope="session")
def auth_token():
    return {
        "access_token": create_test_token(1, "testuser1", "access"),
        "refresh_token": create_test_token(1, "testuser1", "refresh"),
    }
