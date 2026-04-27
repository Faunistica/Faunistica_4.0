from datetime import datetime
from typing import Literal
from uuid import uuid4

from schema.records import RecordBelonging, RecordData, RecordMetadata, RecordType


# FIXME: core!!!
def _mock_validate_record(data: RecordData) -> str | None:
    errors: list[str] = []

    if not data.family:
        errors.append("family is required")
    if not data.genus:
        errors.append("genus is required")
    if not data.species:
        errors.append("species is required")

    lat = data.latitude
    if isinstance(lat, (int, float)) and (lat < -90 or lat > 90):
        errors.append("latitude must be between -90 and 90")

    lon = data.longitude
    if isinstance(lon, (int, float)) and (lon < -180 or lon > 180):
        errors.append("longitude must be between -180 and 180")

    if errors:
        return "; ".join(errors)
    return None


def _determine_type(
    errors: str | None,
    submission_type: Literal["submit", "autosave"],
) -> RecordType:
    if errors is None:
        return "rec_ok" if submission_type == "submit" else "check_ok"

    return "rec_fail" if submission_type == "submit" else "check_fail"


def create_record_metadata(
    record: RecordData | None,
    belongs_to: RecordBelonging,
    submission_type: Literal["submit", "autosave"],
    ip: str | None,
) -> RecordMetadata:
    errors = _mock_validate_record(record) if record else "Пустая запись"
    type = _determine_type(errors, submission_type) if record else "check_fail"

    # NOTE: maybe include TZ info from config?
    now = datetime.now()

    return RecordMetadata(
        publ_id=belongs_to.publ_id,
        user_id=belongs_to.user_id,
        id=uuid4(),
        errors=errors,
        type=type,
        created_at=now,
        updated_at=now,
        ip=ip,
    )
