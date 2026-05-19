#!/usr/bin/env -S uv run --script

import asyncio
import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from core.database import get_session
from core.lifespan import _compare_schema

logging.basicConfig(level=logging.INFO)


async def main() -> None:
    async for session in get_session():
        conn = await session.connection()
        await conn.run_sync(_compare_schema)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except RuntimeError:
        sys.exit(1)
