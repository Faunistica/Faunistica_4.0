#!/usr/bin/env -S uv run --script
"""Compare SQLAlchemy models against live DB schema.

Usage:  python -m scripts.check_schema

Exit codes:
  0 — clean (no mismatches)
  1 — mismatches found
  2 — unexpected error
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

import logging

from sqlalchemy import inspect as sa_inspect
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.sql.schema import DefaultClause

from core.config import settings
from core.model import Base

logger = logging.getLogger(__name__)

_DEFAULT_ALLOWLIST = {"now()", "CURRENT_TIMESTAMP"}


_TYPE_MAP: dict[str, str] = {
    "character varying": "varchar",
    "timestamp": "timestamp",
    "uuid": "uuid",
    "bigint": "bigint",
    "integer": "integer",
    "boolean": "boolean",
    "double precision": "double",
    "numeric": "numeric",
    "text": "text",
}


def _normalise_type(col_type: object) -> str:
    raw = str(col_type).lower()
    for prefix, mapped in _TYPE_MAP.items():
        if prefix in raw:
            return mapped
    return raw


def _type_str(pg_col: dict) -> str:
    raw = str(pg_col["type"]).lower()
    for prefix, mapped in _TYPE_MAP.items():
        if raw.startswith(prefix):
            return mapped
    return raw


_NORM_DEFAULTS: dict[str, str] = {
    "now()": "CURRENT_TIMESTAMP",
    "CURRENT_TIMESTAMP": "CURRENT_TIMESTAMP",
}


def _clean_default(raw: str | None) -> str | None:
    if raw is None:
        return None
    cleaned = raw.strip().lower().rstrip(";").replace('"', "'")
    # PG wraps literals like ''::text → normalize
    if cleaned.endswith("::text") or cleaned.endswith("::character varying"):
        cleaned = cleaned.rsplit("::", 1)[0]
    # PG encodes empty string as '' → normalize
    if cleaned in ("''", '""'):
        cleaned = ""
    return _NORM_DEFAULTS.get(cleaned, cleaned)


async def check_schema() -> int:  # noqa: PLR0912, PLR0915
    mismatches: list[str] = []
    warnings: list[str] = []

    engine = create_async_engine(str(settings.DB_URL))

    try:
        async with engine.connect() as conn:

            def _has_table(sync_conn: object, name: str) -> bool:
                inspector = sa_inspect(sync_conn)
                if inspector is None:
                    raise ValueError
                return inspector.has_table(name)

            def _get_columns(sync_conn: object, name: str) -> list[dict]:
                inspector = sa_inspect(sync_conn)
                if inspector is None:
                    raise ValueError
                return inspector.get_columns(name)

            def _get_pk(sync_conn: object, name: str) -> dict:
                inspector = sa_inspect(sync_conn)
                if inspector is None:
                    raise ValueError
                return inspector.get_pk_constraint(name)

            for table_name in Base.metadata.tables:
                model_table = Base.metadata.tables[table_name]

                # --- check table exists ---
                exists = await conn.run_sync(_has_table, table_name)
                if not exists:
                    mismatches.append(f"Table {table_name!r} is missing from DB")
                    continue

                pg_cols = {
                    c["name"]: c for c in await conn.run_sync(_get_columns, table_name)
                }
                model_cols = {c.name: c for c in model_table.columns}

                # --- check columns ---
                for col_name, model_col in model_cols.items():
                    pg_col = pg_cols.get(col_name)
                    if pg_col is None:
                        mismatches.append(f"  {table_name}.{col_name}: missing from DB")
                        continue

                    model_type = _normalise_type(model_col.type)
                    pgtype = _type_str(pg_col)
                    if model_type != pgtype:
                        mismatches.append(
                            f"  {table_name}.{col_name}: type mismatch"
                            f" (model={model_type}, db={pgtype})"
                        )

                    model_nullable = model_col.nullable
                    pg_nullable = pg_col.get("nullable")
                    if model_nullable != pg_nullable:
                        mismatches.append(
                            f"  {table_name}.{col_name}: nullable mismatch"
                            f" (model={model_nullable}, db={pg_nullable})"
                        )

                    sv_def = model_col.server_default
                    sv_def_arg = None
                    if isinstance(sv_def, DefaultClause):
                        try:
                            sv_def_arg = str(sv_def.arg)
                        except Exception:
                            sv_def_arg = None

                    model_default = _clean_default(sv_def_arg)
                    pgdefault = _clean_default(pg_col.get("default"))
                    if model_default != pgdefault:
                        al = model_default in _DEFAULT_ALLOWLIST
                        if al and pgdefault in _DEFAULT_ALLOWLIST:
                            warnings.append(
                                f"  {table_name}.{col_name}: default allowlist"
                                f" mismatch ({model_default} vs {pgdefault})"
                            )
                        else:
                            mismatches.append(
                                f"  {table_name}.{col_name}: default mismatch"
                                f" (model={model_default}, db={pgdefault})"
                            )

                # --- check PK constraints ---
                model_pk = {c.name for c in model_table.primary_key}
                pk_info = await conn.run_sync(_get_pk, table_name)
                pg_pk = set(pk_info.get("constrained_columns", []))
                if model_pk != pg_pk:
                    mismatches.append(
                        f"  {table_name}: PK mismatch (model={model_pk}, db={pg_pk})"
                    )

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
