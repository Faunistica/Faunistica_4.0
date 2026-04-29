import logging
from collections.abc import Sequence
from typing import Any

from sqlalchemy import func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.model import EventRecord, Publication, User

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

    stmt = select(Publication.language).where(
        Publication.ural.is_(True),
        Publication.coords.is_(True),
        Publication.occs.is_(True),
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

    result = await session.execute(select(EventRecord.type))
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
        func.count(
            func.distinct(func.concat(EventRecord.genus, "_", EventRecord.species))
        )
    ).where(EventRecord.type == "rec_ok")
    families_stmt = select(func.count(func.distinct(EventRecord.family))).where(
        EventRecord.type == "rec_ok"
    )

    species_result = await session.execute(species_stmt)
    families_result = await session.execute(families_stmt)

    stats["species_count"] = species_result.scalar()
    stats["families_count"] = families_result.scalar()

    return stats


async def get_user_stats(session: AsyncSession, user_id: int) -> dict:
    stats = {}

    publ_ids = set()
    publs = []
    recs_stmt = select(EventRecord.publ_id).where(EventRecord.user_id == user_id)

    result = await session.execute(recs_stmt)
    for publ_id in result.scalars().all():
        publs.append(publ_id)
        publ_ids.add(publ_id)

    stats["processed_publs"] = max(len(publ_ids), 0)
    total_records = len(publs)

    result = await session.execute(
        select(EventRecord.type).where(EventRecord.user_id == user_id)
    )
    records = result.scalars().all()

    rec_ok = records.count("rec_ok")
    rec_check = sum("check" in (r or "") for r in records)

    stats.update(
        {
            "rec_ok": rec_ok,
            "check_ratio": round(rec_check / rec_ok, 2) if total_records else 0,
        }
    )

    species_stmt = select(
        func.count(
            func.distinct(func.concat(EventRecord.genus, "_", EventRecord.species))
        )
    ).where(EventRecord.type == "rec_ok", EventRecord.user_id == user_id)
    result = await session.execute(species_stmt)
    stats["species_count"] = result.scalar()

    result = await session.execute(
        text("""
        SELECT mode() WITHIN GROUP (ORDER BY CONCAT(tax_gen, ' ', tax_sp))
        FROM records
        WHERE type = 'rec_ok' AND user_id = :user_id
    """),
        {"user_id": user_id},
    )
    stats["most_common_species"] = result.scalar()

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
