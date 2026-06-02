from datetime import UTC, datetime, timedelta
from core.config import settings

def is_registration_expired(created_at: datetime, now: datetime | None = None) -> bool:
    # created_at comes from DB and can be naive (without tz). Treat naive values as UTC.
    created_at_utc = (
        created_at.replace(tzinfo=UTC)
        if created_at.tzinfo is None
        else created_at.astimezone(UTC)
    )
    current_time_utc = now or datetime.now(UTC)
    current_time_utc = (
        current_time_utc.replace(tzinfo=UTC)
        if current_time_utc.tzinfo is None
        else current_time_utc.astimezone(UTC)
    )
    return (current_time_utc - created_at_utc) > timedelta(
        seconds=settings.REGISTRATION_EXPIRE_SECONDS
    )
