import asyncio
import json
import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path

import aiohttp
from aiohttp_socks import ProxyConnector
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from fastapi import FastAPI
from sqlalchemy import Connection, text

from bot import bot
from core.config import settings
from core.database import _engine, get_session, init_db, ping_db
from core.model import Base
from repository.registration import (
    delete_confirmed_pending,
    delete_expired_pending,
    delete_registration_pending,
)
from schema.geo import RegionData

_ALEMBIC_CFG_PATH = Path.cwd() / "alembic.ini"

logger = logging.getLogger(__name__)


def _compare_schema(conn: Connection) -> None:
    context = MigrationContext.configure(conn)
    diff = compare_metadata(context, Base.metadata)

    _LABEL = {
        "add_table": "Missing table in database",
        "remove_table": "Unexpected table in database",
        "add_column": "Missing column",
        "remove_column": "Unexpected column in database",
        "modify_column": "Modified column",
        "add_constraint": "Missing constraint",
        "remove_constraint": "Unexpected constraint in database",
    }

    errors = 0

    for i in diff:
        op = i[0]
        label = _LABEL.get(op)
        if op == "remove_table" and i[1].name in ["records", "spiders"]:
            continue
        if label is not None and op in ("add_table", "remove_table"):
            logger.error("Schema diff: %s (%s)", label, i[1].name)
        elif label is not None and op in ("add_column", "remove_column"):
            _, _, table_name, col = i
            logger.error(
                "Schema diff: %s (%s.%s %s)", label, table_name, col.name, col.type
            )
        elif label is not None and op == "modify_column":
            _, _, table_name, old_col, new_col = i
            logger.error(
                "Schema diff: %s (%s.%s): %s -> %s",
                label,
                table_name,
                new_col.name,
                old_col.type,
                new_col.type,
            )
        else:
            logger.error("Schema diff: unhandled alembic action proposed — %s", i)

        errors += 1

    if errors == 0:
        return

    if settings.DEV_MODE:
        logger.critical(
            "Database schema diff detected, as DEV_MODE is set, "
            "resetting database is advised"
        )

    raise RuntimeError("Database schema diff detected")


async def _check_alembic_version() -> None:
    """Verify DB schema matches Alembic head revision."""
    cfg = Config(str(_ALEMBIC_CFG_PATH))
    script = ScriptDirectory.from_config(cfg)
    head_rev = script.get_current_head()

    try:
        async with _engine.connect() as conn:
            result = await conn.execute(text("SELECT version_num FROM alembic_version"))
            row = result.fetchone()
            db_rev = row[0] if row else None
    except Exception:
        logger.warning("Database schema was created without using alembic")
        db_rev = None

    if db_rev != head_rev:
        msg = (
            f"Database is at revision {db_rev}, expected {head_rev}. "
            "Run `alembic upgrade head` to sync."
        )
        logger.critical(msg)
        raise RuntimeError(msg)

    async with _engine.connect() as conn:
        await conn.run_sync(_compare_schema)

    logger.info("Alembic migrations are up to date (head: %s)", head_rev)


async def _cleanup_pending_registrations() -> None:
    while True:
        try:
            async for session in get_session():
                now = datetime.now(UTC).replace(tzinfo=None)
                token_expired_cutoff = now - timedelta(
                    seconds=settings.TG_TOKEN_EXPIRE_SECONDS
                )
                confirmed_cutoff = now - timedelta(
                    seconds=settings.REGISTRATION_PENDING_CONFIRMED_BACKLOG_SECONDS
                )
                survey_cutoff = now - timedelta(
                    seconds=settings.SURVEY_FILLING_INTERVAL_SECONDS
                )
                expired_count = await delete_expired_pending(
                    session, token_expired_cutoff
                )
                confirmed_count = await delete_confirmed_pending(
                    session, confirmed_cutoff
                )
                registration_count = await delete_registration_pending(
                    session, survey_cutoff
                )
                if expired_count or confirmed_count or registration_count:
                    logger.info(
                        "Cleaned pending reg: expired=%d confirmed=%d on_survey=%d",
                        expired_count,
                        confirmed_count,
                        registration_count,
                    )
                await session.commit()
        except asyncio.CancelledError:
            return
        except Exception:
            logger.exception("Failed to clean pending registrations")
        try:
            await asyncio.sleep(settings.REGISTRATION_PENDING_CLEANUP_INTERVAL_SECONDS)
        except asyncio.CancelledError:
            return


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    await init_db()
    await _check_alembic_version()

    if not await ping_db():
        logger.critical("Database is not available. Application cannot start.")
        raise RuntimeError("Database connection failed")

    logger.info("Database connection verified")

    if settings.BOT_PROXY is not None:
        proxy_url = settings.BOT_PROXY.unicode_string()
        if proxy_url.startswith(("socks5://", "socks4://")):
            connector = ProxyConnector.from_url(proxy_url)
            app.state.http_session = aiohttp.ClientSession(connector=connector)
        else:
            app.state.http_session = aiohttp.ClientSession(proxy=proxy_url)
        logger.info("HTTP session configured with proxy: %s", settings.BOT_PROXY)
    else:
        app.state.http_session = aiohttp.ClientSession()
        logger.info("HTTP session created without proxy")

    app.state.location_data = {"ru": [], "en": []}
    
    json_path = settings.LOCATIONS_JSON_PATH
    if json_path.exists():
        try:
            with open(json_path, encoding="utf-8") as f:  # noqa: ASYNC230
                raw_data = json.load(f)
                app.state.location_data["ru"] = [RegionData(**item) for item in raw_data]
            logger.info("Location data loaded (RU)")
        except (FileNotFoundError, json.JSONDecodeError, OSError) as e:
            logger.error("Failed to load location data (RU): %s", e, exc_info=True)
    else:
        logger.warning("Location data file not found at %s", json_path)

    json_en_path = settings.LOCATIONS_EN_JSON_PATH
    if json_en_path.exists():
        try:
            with open(json_en_path, encoding="utf-8") as f:  # noqa: ASYNC230
                raw_data = json.load(f)
                app.state.location_data["en"] = [RegionData(**item) for item in raw_data]
            logger.info("Location data loaded (EN)")
        except (FileNotFoundError, json.JSONDecodeError, OSError) as e:
            logger.error("Failed to load location data (EN): %s", e, exc_info=True)
    else:
        logger.warning("Location data file not found at %s", json_en_path)

    bot_task = asyncio.create_task(bot.start())
    cleanup_task = asyncio.create_task(_cleanup_pending_registrations())

    try:
        yield
    finally:
        logger.info("Closing HTTP session...")
        await app.state.http_session.close()
        logger.info("Shutting down bot...")
        bot_task.cancel()
        logger.info("Stopping registration cleanup...")
        cleanup_task.cancel()
        await asyncio.gather(bot_task, cleanup_task)
