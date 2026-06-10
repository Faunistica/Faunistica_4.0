from collections.abc import Sequence

from sqlalchemy import SQLColumnExpression, func, select, union_all
from sqlalchemy.engine import Row
from sqlalchemy.ext.asyncio import AsyncSession

from core.enums import RecordType
from core.model import EventRecord, Publication, records_table
from schema.common import TopSpeciesItem


async def _most_common_combined[T](
    session: AsyncSession,
    user_id: int,
    event_col: SQLColumnExpression[T],
    event_expr: SQLColumnExpression[T],
    legacy_expr: SQLColumnExpression[T],
    label: str,
    empty_value: str = "",
) -> T | None:
    er = select(event_expr.label(label)).where(
        EventRecord.user_id == user_id,
        EventRecord.type == RecordType.REC_OK,
    )
    r = select(legacy_expr.label(label)).where(
        records_table.c.user_id == user_id,
        records_table.c.type == "rec_ok",
    )
    combined = union_all(er, r).subquery()
    stmt = (
        select(combined.c[label])
        .where(
            combined.c[label].isnot(None),
            combined.c[label] != empty_value,
        )
        .group_by(combined.c[label])
        .order_by(func.count().desc())
        .limit(1)
    )
    return await session.scalar(stmt)


async def most_common_family(session: AsyncSession, user_id: int) -> str | None:
    return await _most_common_combined(
        session,
        user_id,
        event_col=EventRecord.family,
        event_expr=EventRecord.family,
        legacy_expr=records_table.c.tax_fam,
        label="family",
    )


async def most_common_genus(session: AsyncSession, user_id: int) -> str | None:
    return await _most_common_combined(
        session,
        user_id,
        event_col=EventRecord.genus,
        event_expr=EventRecord.genus,
        legacy_expr=records_table.c.tax_gen,
        label="genus",
    )


async def most_common_species(session: AsyncSession, user_id: int) -> str | None:
    event_species = EventRecord.genus + " " + EventRecord.species
    legacy_species = records_table.c.tax_gen + " " + records_table.c.tax_sp
    return await _most_common_combined(
        session,
        user_id,
        event_col=event_species,
        event_expr=event_species,
        legacy_expr=legacy_species,
        label="species",
        empty_value=" ",
    )


async def _most_common_year(session: AsyncSession, user_id: int) -> int | None:
    er = (
        select(Publication.year.label("year"))
        .select_from(EventRecord)
        .join(Publication, EventRecord.publ_id == Publication.publ_id)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type == RecordType.REC_OK,
            Publication.year.isnot(None),
        )
    )
    r = select(records_table.c.eve_YY.label("year")).where(
        records_table.c.user_id == user_id,
        records_table.c.type == "rec_ok",
        records_table.c.eve_YY.isnot(None),
    )
    combined = union_all(er, r).subquery()
    return await session.scalar(
        select(combined.c.year)
        .where(combined.c.year.isnot(None))
        .group_by(combined.c.year)
        .order_by(func.count().desc())
        .limit(1)
    )


async def top_user_species(
    session: AsyncSession, user_id: int, limit: int = 4
) -> list[TopSpeciesItem]:
    stmt = (
        select(
            EventRecord.genus,
            EventRecord.species,
            func.count().label("cnt"),
        )
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.genus, EventRecord.species)
        .order_by(func.count().desc())
    )
    rows = (await session.execute(stmt)).all()
    return await _merge_top_species(session, user_id, rows, limit)


async def _merge_top_species(
    session: AsyncSession,
    user_id: int,
    rows: Sequence[Row],
    limit: int = 4,
) -> list[TopSpeciesItem]:
    result = await session.execute(
        select(
            records_table.c.tax_gen,
            records_table.c.tax_sp,
            func.count().label("cnt"),
        )
        .where(
            records_table.c.user_id == user_id,
            records_table.c.type == "rec_ok",
        )
        .group_by(records_table.c.tax_gen, records_table.c.tax_sp)
        .order_by(func.count().desc())
    )
    legacy_top = {(r.tax_gen, r.tax_sp): r.cnt for r in result.fetchall()}
    species_counts: dict[tuple[str | None, str | None], int] = {}
    for r in rows:
        key = (r.genus, r.species)
        species_counts[key] = species_counts.get(key, 0) + r.cnt
    for (g, s), c in legacy_top.items():
        species_counts[(g, s)] = species_counts.get((g, s), 0) + c
    top_sorted = sorted(species_counts.items(), key=lambda x: -x[1])[:limit]
    return [
        TopSpeciesItem(species=f"{g} {s}".strip(), count=c) for (g, s), c in top_sorted
    ]
