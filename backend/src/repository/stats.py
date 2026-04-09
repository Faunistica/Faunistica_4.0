import logging
from collections.abc import Sequence
from typing import Any

from sqlalchemy import func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database.models import Publ, Record, User

logger = logging.getLogger(__name__)


async def get_general_stats(session: AsyncSession) -> dict:
    stats = {}

    stmt = (
        select(func.count())
        .select_from(User)
        .where((User.reg_stat == 1) | (User.reg_stat >= 7))
    )
    result = await session.execute(stmt)
    stats["total_users"] = result.scalar()

    result = await session.execute(select(func.avg(User.age)))
    avg_age = result.scalar()
    stats["avg_age"] = round(avg_age, 1) if avg_age else 0

    stmt = select(Publ.language).where(
        Publ.ural.is_(True), Publ.coords.is_(True), Publ.occs.is_(True)
    )
    result = await session.execute(stmt)
    langs = result.scalars().all()
    stats.update(
        {
            "total_publs": len(langs),
            "rus_publs": sum("rus" in (lang or "").lower() for lang in langs),
            "eng_publs": sum("eng" in (lang or "").lower() for lang in langs),
        }
    )

    result = await session.execute(select(Record.type))
    records = result.scalars().all()
    rec_ok = records.count("rec_ok")

    stats["rec_ok"] = rec_ok
    stats["rec_fail_ratio"] = (
        round(records.count("rec_fail") / rec_ok, 2) if rec_ok else 0
    )
    stats["check_ratio"] = (
        round(sum("check" in (r or "") for r in records) / rec_ok, 2) if rec_ok else 0
    )

    species_stmt = select(
        func.count(func.distinct(func.concat(Record.tax_gen, "_", Record.tax_sp)))
    ).where(Record.type == "rec_ok")
    families_stmt = select(func.count(func.distinct(Record.tax_fam))).where(
        Record.type == "rec_ok"
    )

    species_result = await session.execute(species_stmt)
    families_result = await session.execute(families_stmt)

    stats["species_count"] = species_result.scalar()
    stats["families_count"] = families_result.scalar()

    return stats


async def get_volunteers_achievements(
    session: AsyncSession,
) -> Sequence[Any]:
    stmt = text("""
        SELECT a.user_id, a.object, a.datetime,
               u.name, u.tlg_name, u.tlg_username
        FROM actions a
        INNER JOIN users u ON a.user_id = u.id
        WHERE a.action = 'fau_100'
        ORDER BY a.datetime DESC
    """)
    result = await session.execute(stmt)
    return result.fetchall()
