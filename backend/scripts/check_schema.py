#!/usr/bin/env -S uv run --script
"""Compare SQLAlchemy models against live DB schema — CLI entry point.

Usage:  python -m scripts.check_schema

Exit codes:
  0 — clean (no mismatches)
  1 — mismatches found
  2 — unexpected error
"""

import asyncio
import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from sqlalchemy.ext.asyncio import create_async_engine

from core.check_schema import run_check_schema
from core.config import settings

logger = logging.getLogger(__name__)


async def check_schema() -> int:
    """CLI entry point. Creates engine, runs check, returns exit code."""
    engine = create_async_engine(str(settings.DB_URL))
    try:
        mismatches, warnings = await run_check_schema(engine)
    except Exception:
        logger.exception("Unexpected error during schema check")
        return 2
    finally:
        await engine.dispose()

    if mismatches:
        logger.error("Schema mismatches found:")
        for m in mismatches:
            logger.error("  %s", m)
        return 1

    for w in warnings:
        logger.warning("Schema warning: %s", w)

    logger.info("Schema check passed — model and DB are in sync")
    return 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    sys.exit(asyncio.run(check_schema()))
