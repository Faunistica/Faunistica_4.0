from sqlalchemy import func, select, text
from sqlalchemy.engine import Row
from sqlalchemy.ext.asyncio import AsyncSession

from core.enums import RecordType, UserState
from core.model import Action, EventRecord, Publication, User
from schema.common import ProjectStats, TopSpeciesItem, UserStats


async def get_project_statistics(session: AsyncSession) -> ProjectStats:
    # TODO: Performance optimization point - consider caching

    total_volunteers = await session.scalar(
        select(func.count())
        .select_from(User)
        .where(
            (User.reg_stat == UserState.REG_COMPLETED)
            | (User.reg_stat >= UserState.SUPPORT)
        )
    )

    total_records = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_OK)
    )

    species_count = await session.scalar(
        select(func.count(func.distinct(EventRecord.genus + " " + EventRecord.species)))
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_OK)
    )

    processed_publications = await session.scalar(
        select(func.count(func.distinct(Action.object)))
        .select_from(Action)
        .where(Action.action == "publ_end_full")
    )

    most_common_family = await session.scalar(
        select(EventRecord.family)
        .where(EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.family)
        .order_by(func.count().desc())
        .limit(1)
    )

    most_common_genus = await session.scalar(
        select(EventRecord.genus)
        .where(EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.genus)
        .order_by(func.count().desc())
        .limit(1)
    )

    most_common_species = await session.scalar(
        select(EventRecord.genus + " " + EventRecord.species)
        .where(EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.genus, EventRecord.species)
        .order_by(func.count().desc())
        .limit(1)
    )

    total_users = await session.scalar(
        select(func.count())
        .select_from(User)
        .where(
            (User.reg_stat == UserState.REG_COMPLETED)
            | (User.reg_stat >= UserState.SUPPORT)
        )
    )

    avg_age_value = await session.scalar(select(func.avg(User.age)))
    avg_age = round(avg_age_value, 1) if avg_age_value is not None else None

    families_count = await session.scalar(
        select(func.count(func.distinct(EventRecord.family)))
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_OK)
    )

    checks_count = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type.in_([RecordType.CHECK_OK, RecordType.CHECK_FAIL]))
    )

    failed_records = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.type == RecordType.REC_FAIL)
    )

    return ProjectStats(
        total_volunteers=total_volunteers or 0,
        total_records=total_records or 0,
        species_count=species_count or 0,
        processed_publications_count=processed_publications or 0,
        most_common_family=most_common_family,
        most_common_genus=most_common_genus,
        most_common_species=most_common_species,
        total_users=total_users or 0,
        avg_age=avg_age,
        families_count=families_count or 0,
        checks_count=checks_count or 0,
        failed_records=failed_records or 0,
    )


async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    return await session.scalar(select(User).where(User.user_id == user_id))


async def get_user_by_name(session: AsyncSession, name: str) -> User | None:
    return await session.scalar(select(User).where(User.name.like(f"%{name}%")))


async def get_user_statistics(session: AsyncSession, user_id: int) -> UserStats:
    records_entered = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )

    publications_processed = await session.scalar(
        select(func.count(func.distinct(EventRecord.publ_id)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )

    most_common_family = await session.scalar(
        select(EventRecord.family)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.family)
        .order_by(func.count().desc())
        .limit(1)
    )

    most_common_genus = await session.scalar(
        select(EventRecord.genus)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.genus)
        .order_by(func.count().desc())
        .limit(1)
    )

    most_common_species = await session.scalar(
        select(EventRecord.genus + " " + EventRecord.species)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.genus, EventRecord.species)
        .order_by(func.count().desc())
        .limit(1)
    )

    top_species_stmt = (
        select(
            EventRecord.genus,
            EventRecord.species,
            func.count().label("cnt"),
        )
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
        .group_by(EventRecord.genus, EventRecord.species)
        .order_by(func.count().desc())
        .limit(4)
    )
    rows = (await session.execute(top_species_stmt)).all()
    top_species = [
        TopSpeciesItem(species=f"{r.genus} {r.species}".strip(), count=r.cnt)
        for r in rows
    ]

    checks_count = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type.in_([RecordType.CHECK_OK, RecordType.CHECK_FAIL]),
        )
    )

    failed_records = await session.scalar(
        select(func.count())
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_FAIL)
    )

    total_individuals = await session.scalar(
        select(func.sum(func.ceil(EventRecord.quantity)))
        .select_from(EventRecord)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type == RecordType.REC_OK,
            EventRecord.quantity.isnot(None),
        )
    )

    distinct_families = await session.scalar(
        select(func.count(func.distinct(EventRecord.family)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )

    distinct_genera = await session.scalar(
        select(func.count(func.distinct(EventRecord.genus)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )

    distinct_species = await session.scalar(
        select(func.count(func.distinct(EventRecord.species)))
        .select_from(EventRecord)
        .where(EventRecord.user_id == user_id, EventRecord.type == RecordType.REC_OK)
    )

    most_common_year = await session.scalar(
        select(Publication.year)
        .select_from(EventRecord)
        .join(Publication, EventRecord.publ_id == Publication.publ_id)
        .where(
            EventRecord.user_id == user_id,
            EventRecord.type == RecordType.REC_OK,
            Publication.year.isnot(None),
        )
        .group_by(Publication.year)
        .order_by(func.count().desc())
        .limit(1)
    )

    return {
        "records_entered": records_entered or 0,
        "publications_processed": publications_processed or 0,
        "most_common_family": most_common_family,
        "most_common_genus": most_common_genus,
        "most_common_species": most_common_species,
        "top_species": top_species,
        "checks_count": checks_count or 0,
        "failed_records": failed_records or 0,
        "total_individuals": total_individuals or 0,
        "distinct_families": distinct_families or 0,
        "distinct_genera": distinct_genera or 0,
        "distinct_species": distinct_species or 0,
        "most_common_year": most_common_year,
    }


async def get_volunteers_achievements(session: AsyncSession) -> list[Row]:
    stmt = text("""
        SELECT a.user_id, a.object, a.datetime,
               u.name, u.tlg_name, u.tlg_username
        FROM actions a
        INNER JOIN users u ON a.user_id = u.user_id
        WHERE a.action IN ('fau_50', 'fau_100')
        ORDER BY a.datetime DESC
    """)
    result = await session.execute(stmt)
    return list(result.fetchall())


async def get_cumulative_volunteers(session: AsyncSession) -> list[Row]:
    stmt = text("""
        SELECT DATE(reg_run) as date, COUNT(*) as cnt
        FROM users
        WHERE reg_run IS NOT NULL
        GROUP BY DATE(reg_run)
        ORDER BY date
    """)
    result = await session.execute(stmt)
    return list(result.fetchall())


async def get_cumulative_records(session: AsyncSession) -> list[Row]:
    stmt = text("""
        SELECT DATE(datetime) as date, COUNT(*) as cnt
        FROM event_records
        WHERE type = 'rec_ok'
        GROUP BY DATE(datetime)
        ORDER BY date
    """)
    result = await session.execute(stmt)
    return list(result.fetchall())


async def get_progress(session: AsyncSession) -> tuple[int, int]:
    admin_ids = [911269241, 412819044, 950994899]
    total_stmt = (
        select(func.count())
        .select_from(Publication)
        .where(
            Publication.ural == 1,
            Publication.spec == 1,
            Publication.occs == 1,
        )
    )
    total = await session.scalar(total_stmt) or 0

    subq = (
        select(EventRecord.publ_id, EventRecord.user_id)
        .join(Publication, EventRecord.publ_id == Publication.publ_id)
        .where(
            EventRecord.type == RecordType.REC_OK,
            Publication.ural == 1,
            Publication.spec == 1,
            Publication.occs == 1,
            EventRecord.user_id.notin_(admin_ids),
        )
        .distinct()
        .subquery()
    )
    count_stmt = select(func.count()).select_from(subq)
    distinct_pairs = await session.scalar(count_stmt) or 0

    return total, distinct_pairs
