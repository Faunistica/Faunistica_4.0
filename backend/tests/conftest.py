import hashlib
import os
import random
from collections.abc import AsyncGenerator, Callable
from datetime import UTC, datetime, timedelta
from typing import TypedDict, cast
from uuid import uuid4

import jwt as pyjwt
import pytest
import pytest_asyncio
from aiohttp import ClientSession
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

from app import app
from core.config import settings
from core.database import get_session
from core.dependencies import get_http_session
from core.model import Base, EventRecord, Publication, User
from core.rate_limiter import limiter
from schema.jwt import Token


def md5_hash(password: str) -> str:
    return hashlib.md5(password.encode()).hexdigest()  # noqa: S324 - testing legacy MD5


@pytest.fixture(scope="session")
async def db_engine():
    if os.getenv("USE_REAL_DB_FOR_TESTS"):
        url = str(settings.DB_URL)
    else:
        pg = PostgresContainer("postgres:15-alpine")
        pg.start()

        url = pg.get_connection_url().replace(
            "postgresql+psycopg2", "postgresql+asyncpg"
        )

    engine = create_async_engine(
        url, echo=False, pool_pre_ping=True, poolclass=NullPool
    )

    async with engine.begin() as conn:
        # Drop tables with CASCADE to handle foreign key constraints
        await conn.execute(text("DROP TABLE IF EXISTS event_records CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS actions CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS publs CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
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
                "TRUNCATE TABLE event_records, actions, users, publs RESTART IDENTITY CASCADE"
            )
        )
        await session.commit()


@pytest_asyncio.fixture(scope="function")
async def session(
    session_maker: Callable[[], AsyncSession],
) -> AsyncGenerator[AsyncSession]:
    async with session_maker() as session:
        yield session
        await session.close()


class SeedData(TypedDict):
    users: list[User]
    passwords: list[str]
    publs: list[Publication]
    records: list[EventRecord]
    record_ids: list[int]


@pytest_asyncio.fixture(scope="function")
async def seed_data(
    session: AsyncSession,
) -> AsyncGenerator[SeedData]:
    """Truncate and seed test data for each test."""

    def from_test(d: dict) -> User:
        return User(
            user_id=d["user_id"],
            name=d["username"],
            tlg_name=d["username"],
            tlg_username=d["username"],
            hash=md5_hash(d["password"]),
            items=d.get("items", ""),
        )

    def id() -> int:
        return random.randint(1000, 999999)

    user_id_1 = id()
    user_id_2 = id()
    user_id_3 = id()
    while user_id_2 == user_id_1:
        user_id_2 = id()
    while user_id_3 in [user_id_1, user_id_2]:
        user_id_3 = id()

    publ_id_1 = id()
    publ_id_2 = id()
    while publ_id_2 == publ_id_1:
        publ_id_2 = id()

    publ1 = Publication(
        publ_id=publ_id_1,
        name="Test Publ",
        type="A",
        year=2000,
        language="rus",
        ural=1,
    )
    session.add(publ1)
    publ2 = Publication(
        publ_id=publ_id_2,
        name="Test Publ 2",
        type="A",
        year=2000,
        language="rus",
        ural=1,
    )
    session.add(publ2)

    test_users = [
        {
            "user_id": user_id_1,
            "username": "testuser1",
            "password": "password1",
            "items": f"{publ_id_1}|{publ_id_2}",
        },
        {
            "user_id": user_id_2,
            "username": "testuser2",
            "password": "password2",
            "items": "",
        },
        {
            "user_id": user_id_3,
            "username": "testuser3",
            "password": "password3",
            "items": str(publ_id_2),
        },
    ]

    users = [from_test(u) for u in test_users]
    for user in users:
        session.add(user)
    await session.flush()

    now = datetime.now(UTC).replace(tzinfo=None)

    record_ids = []
    records = [
        EventRecord(
            id=uuid4(),
            user_id=users[0].user_id,
            publ_id=publ_id_1,
            type="rec_ok",
            genus="Testus",
            latitude="55.5",
            longitude="37.5",
            created_at=now,
            updated_at=now,
        ),
        EventRecord(
            id=uuid4(),
            user_id=users[0].user_id,
            publ_id=publ_id_1,
            type="rec_ok",
            genus="Testus",
            latitude="55.6",
            longitude="37.6",
            created_at=now,
            updated_at=now,
        ),
        EventRecord(
            id=uuid4(),
            user_id=users[0].user_id,
            publ_id=publ_id_1,
            type="rec_fail",
            created_at=now,
            updated_at=now,
        ),
    ]
    for record in records:
        session.add(record)
        record_ids.append(str(record.id))

    await session.commit()
    yield SeedData(
        {
            "users": users,
            "passwords": [cast("str", user["password"]) for user in test_users],
            "publs": [publ1, publ2],
            "records": records,
            "record_ids": record_ids,
        }
    )


@pytest_asyncio.fixture
async def async_client(session_maker: Callable[[], AsyncSession]):
    original_overrides = app.dependency_overrides.copy()

    async def _maker():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_session] = _maker

    http_session = ClientSession()

    def get_test_http_session():
        return http_session

    app.dependency_overrides[get_http_session] = get_test_http_session

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            follow_redirects=True,
            cookies=Cookies(),
        ) as client:
            yield client
    finally:
        await http_session.close()
        app.dependency_overrides = original_overrides


@pytest.fixture
def authenticated_client(
    async_client: AsyncClient,
    seed_data: SeedData,
) -> AsyncClient:
    """Return async_client with testuser1's access token (user_id=1, has current publication publ_id_1)."""
    tokens = auth_tokens(seed_data["users"][0])

    async_client.cookies.set("access_token", tokens["access_token"])
    return async_client


@pytest.fixture
def authenticated_client_user2(
    async_client: AsyncClient,
    seed_data: SeedData,
) -> AsyncClient:
    """Return async_client with testuser2's access token (user_id=2, no publications)."""
    tokens = auth_tokens(seed_data["users"][1])

    async_client.cookies.set("access_token", tokens["access_token"])
    return async_client


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


def auth_tokens(user: User):
    return {
        "access_token": create_test_token(user.user_id, user.name or "", "access"),
        "refresh_token": create_test_token(user.user_id, user.name or "", "refresh"),
    }


@pytest.fixture()
def enable_rate_limiting(async_client: AsyncClient):
    """Temporarily enable rate limiting for tests."""
    app.state.limiter.enabled = True
    limiter.enabled = True
    limiter._storage.reset()
    yield
    app.state.limiter.enabled = False
    limiter.enabled = False
