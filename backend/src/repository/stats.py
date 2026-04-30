from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from core.model import Action, EventRecord, User


async def get_project_statistics(session: AsyncSession) -> dict[str, Any]:
    # TODO: Performance optimization point - consider caching

    total_volunteers = await session.scalar(
        select(func.count())
        .select_from(User)
        .where((User.reg_stat == 1) | (User.reg_stat >= 7))
    )

    total_records = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type == "rec_ok")
    )

    species_count = await session.scalar(
        select(func.count(func.distinct(EventRecord.genus + " " + EventRecord.species)))
        .select_from(EventRecord)
        .where(EventRecord.type == "rec_ok")
    )

    processed_publications = await session.scalar(
        select(func.count(func.distinct(Action.object)))
        .select_from(Action)
        .where(Action.action == "publ_end_full")
    )

    most_common_family = await session.scalar(
        select(EventRecord.family)
        .where(EventRecord.type == "rec_ok")
        .group_by(EventRecord.family)
        .order_by(func.count().desc())
        .limit(1)
    )

    most_common_genus = await session.scalar(
        select(EventRecord.genus)
        .where(EventRecord.type == "rec_ok")
        .group_by(EventRecord.genus)
        .order_by(func.count().desc())
        .limit(1)
    )

    most_common_species = await session.scalar(
        select(EventRecord.genus + " " + EventRecord.species)
        .where(EventRecord.type == "rec_ok")
        .group_by(EventRecord.genus, EventRecord.species)
        .order_by(func.count().desc())
        .limit(1)
    )

    return {
        "total_volunteers": total_volunteers or 0,
        "total_records": total_records or 0,
        "species_count": species_count or 0,
        "processed_publications_count": processed_publications or 0,
        "most_common_family": most_common_family,
        "most_common_genus": most_common_genus,
        "most_common_species": most_common_species,
    }


async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    return await session.scalar(select(User).where(User.user_id == user_id))


async def get_user_by_name(session: AsyncSession, name: str) -> User | None:
    return await session.scalar(select(User).where(User.name.like(f"%{name}%")))


async def get_user_statistics(session: AsyncSession, user_id: int) -> dict[str, Any]:
    records_entered = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == "rec_ok")
    )

    publications_processed = await session.scalar(
        select(func.count(func.distinct(EventRecord.publ_id)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == "rec_ok")
    )

    most_common_family = await session.scalar(
        select(EventRecord.family)
        .where(EventRecord.user_id == user_id, EventRecord.type == "rec_ok")
        .group_by(EventRecord.family)
        .order_by(func.count().desc())
        .limit(1)
    )

    most_common_genus = await session.scalar(
        select(EventRecord.genus)
        .where(EventRecord.user_id == user_id, EventRecord.type == "rec_ok")
        .group_by(EventRecord.genus)
        .order_by(func.count().desc())
        .limit(1)
    )

    most_common_species = await session.scalar(
        select(EventRecord.genus + " " + EventRecord.species)
        .where(EventRecord.user_id == user_id, EventRecord.type == "rec_ok")
        .group_by(EventRecord.genus, EventRecord.species)
        .order_by(func.count().desc())
        .limit(1)
    )

    return {
        "records_entered": records_entered or 0,
        "publications_processed": publications_processed or 0,
        "most_common_family": most_common_family,
        "most_common_genus": most_common_genus,
        "most_common_species": most_common_species,
    }


async def get_volunteers_achievements(
    session: AsyncSession,
) -> list[Any]:
    stmt = text("""
        SELECT a.user_id, a.object, a.datetime,
               u.name, u.tlg_name, u.tlg_username
        FROM actions a
        INNER JOIN users u ON a.user_id = u.user_id
        WHERE a.action = 'fau_100'
        ORDER BY a.datetime DESC
    """)
    result = await session.execute(stmt)
    return list(result.fetchall())
