import logging

from cachetools import TTLCache
from sqlalchemy.ext.asyncio import AsyncSession

from repository.stats import (
    avg_user_age,
    compute_check_ratio,
    compute_rec_fail_ratio,
    count_checks,
    count_failed_records,
    count_families,
    count_publications,
    count_species,
    count_total_records,
    count_total_users,
    count_user_publications,
    most_common_species,
)

logger = logging.getLogger(__name__)

_bot_general_cache = TTLCache(maxsize=1, ttl=300)
_bot_user_cache = TTLCache(maxsize=1024, ttl=300)


async def get_bot_general_stats(session: AsyncSession) -> dict:
    if (cached := _bot_general_cache.get("bot_general_stats")) is not None:
        return cached

    rec_ok = await count_total_records(session)
    rec_fail = await count_failed_records(session)
    total_checks = await count_checks(session)

    result = {
        "total_users": await count_total_users(session),
        "avg_age": await avg_user_age(session),
        "total_publs": await count_publications(session),
        "rus_publs": await count_publications(session, language="rus"),
        "eng_publs": await count_publications(session, language="eng"),
        "rec_ok": rec_ok,
        "rec_fail_ratio": compute_rec_fail_ratio(rec_fail, rec_ok),
        "check_ratio": compute_check_ratio(total_checks, rec_ok),
        "species_count": await count_species(session),
        "families_count": await count_families(session),
    }
    _bot_general_cache["bot_general_stats"] = result
    return result


async def get_bot_user_stats(session: AsyncSession, user_id: int) -> dict:
    key = f"bot_user_stats:{user_id}"
    if (cached := _bot_user_cache.get(key)) is not None:
        return cached

    records = await count_total_records(session, user_id=user_id)
    checks = await count_checks(session, user_id=user_id)

    result = {
        "processed_publs": await count_user_publications(session, user_id),
        "rec_ok": records,
        "check_ratio": compute_check_ratio(checks, records),
        "species_count": await count_species(session, user_id=user_id),
        "most_common_species": await most_common_species(session, user_id),
    }
    _bot_user_cache[key] = result
    return result
