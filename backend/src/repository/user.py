import logging
from datetime import datetime
from typing import Any

from sqlalchemy import and_, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.sql.expression import text

from core.security import check_password_hash
from core.utils import format_event_date
from models import Publ, Record, User
from schemas.common import EventDate

logger = logging.getLogger(__name__)


async def find_user_by_username(session: AsyncSession, username: str) -> User | None:
    stmt = select(User).where(User.name == username)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def is_pass_correct(session: AsyncSession, user_id: int, user_pass: str) -> bool:
    stmt = select(User.hash).where(User.id == user_id)
    result = await session.execute(stmt)
    user_hash = result.scalar_one()

    if user_hash is None:
        logger.warning("trying to check password for user without one: id: %d", user_id)
        return False

    return check_password_hash(user_pass, user_hash)


async def get_user(session: AsyncSession, user_id: int) -> User:
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    return result.scalar_one()


# FIXME: N+1, dict as return type
async def get_username_and_publications(session: AsyncSession, user_id: int) -> dict:
    user = await get_user(session, user_id)
    if not user:
        return {"error": "User not found"}

    data: dict[str, str | dict | None] = {"user_name": user.name, "publication": None}

    if user.publ_id:
        stmt = select(Publ).filter_by(id=user.publ_id)
        result = await session.execute(stmt)
        publication = result.scalar_one_or_none()
        if publication is not None:
            data["publication"] = {
                "author": publication.author,
                "year": str(publication.year),
                "name": publication.name,
                "pdf_file": publication.pdf_file,
            }

    return data


async def create_user(session: AsyncSession, user_id: int, reg_stat: int) -> None:
    user = User(id=user_id, reg_stat=reg_stat, reg_run=datetime.now())
    session.add(user)
    await session.commit()


async def update_user(
    session: AsyncSession,
    user_id: int,
    **fields: Any,
) -> None:
    stmt = update(User).where(User.id == user_id).values(**fields)
    await session.execute(stmt)
    await session.commit()


async def count_users_with_name(session: AsyncSession, name: str) -> int:
    stmt = select(func.count()).select_from(User).where(User.name == name)
    result = await session.execute(stmt)
    return result.scalar_one()


async def get_user_stats(session: AsyncSession, user_id: int) -> dict:
    stats = {}

    publ_ids = set()
    publs = []
    recs_stmt = select(Record.publ_id).where(Record.user_id == user_id)

    result = await session.execute(recs_stmt)
    for publ_id in result.scalars().all():
        publs.append(publ_id)
        publ_ids.add(publ_id)

    stats["processed_publs"] = max(len(publ_ids), 0)
    total_records = len(publs)

    result = await session.execute(select(Record.type).where(Record.user_id == user_id))
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
        func.count(func.distinct(func.concat(Record.genus, "_", Record.species)))
    ).where(Record.type == "rec_ok", Record.user_id == user_id)
    result = await session.execute(species_stmt)
    stats["species_count"] = result.scalar()

    result = await session.execute(
        text("""
        SELECT mode() WITHIN GROUP (ORDER BY CONCAT(genus, ' ', specificepithet))
        FROM records
        WHERE type = 'rec_ok' AND user_id = :user_id
    """),
        {"user_id": user_id},
    )
    stats["most_common_species"] = result.scalar()

    return stats


async def get_personal_stats(session: AsyncSession, user_id: int) -> list[dict]:
    stmt = (
        select(
            Record.id,
            Record.publ_id,
            Record.datetime,
            Record.district,
            Record.region,
            Record.genus,
            Record.species,
            Record.quantity,
            Record.year,
            Record.month,
            Record.day,
            Record.year_end,
            Record.month_end,
            Record.day_end,
            Publ.author,
        )
        .join(Publ, Publ.id == Record.publ_id)
        .where(and_(Record.user_id == user_id, Record.type == "rec_ok"))
        .order_by(Record.datetime.desc())
    )

    result = await session.execute(stmt)
    rows = result.all()

    records = []
    for row in rows:
        date = format_event_date(
            EventDate(
                yy=row.year,
                mm=row.month,
                dd=row.day,
                yy_end=row.year_end,
                mm_end=row.month_end,
                dd_end=row.day_end,
            )
        )
        location_parts = []
        if row.district is not None:
            location_parts.append(row.district)
        if row.region is not None:
            location_parts.append(row.region)

        location = ", ".join(location_parts) if location_parts else "Не заполнено"

        species_parts = []
        if row.genus is not None:
            species_parts.append(row.genus)
        if row.species is not None:
            species_parts.append(row.species)

        species = " ".join(species_parts) if species_parts else "Не заполнено"

        records.append(
            {
                "id": row.id,
                "date": str(row.datetime),
                "author": row.author,
                "species": species,
                "abundance": row.quantity,
                "locality": location,
                "even_date": date,
            }
        )

    return records
