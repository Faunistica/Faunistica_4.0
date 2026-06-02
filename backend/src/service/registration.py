from datetime import datetime, timedelta

REGISTRATION_EXPIRE_SECONDS = 15 * 60
REGISTRATION_POLL_INTERVAL_SECONDS = 1
REGISTRATION_POLL_TIMEOUT_SECONDS = 25


def is_registration_expired(created_at: datetime, now: datetime | None = None) -> bool:
    current_time = now or datetime.now()
    return current_time - created_at > timedelta(seconds=REGISTRATION_EXPIRE_SECONDS)
