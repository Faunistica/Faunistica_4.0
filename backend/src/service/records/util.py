from datetime import datetime
from typing import Literal
from uuid import uuid4

from core.model import EventRecord
from schema.records import (
    RecordData,
    RecordFull,
    RecordMetadata,
    RecordType,
    SpecimenDbRow,
)
from service.records.convert import specimens_from_record, specimens_to_db
from service.records.validation import validate_record
from service.records.validation.errors import ErrorCollection


def _determine_type(
    errors: ErrorCollection,
    submission_type: Literal["submit", "autosave"],
) -> RecordType:
    if not errors.has_errors():
        return "rec_ok" if submission_type == "submit" else "check_ok"

    return "rec_fail" if submission_type == "submit" else "check_fail"


def _create_record_metadata(
    record: RecordData | None,
    user_id: int,
    publ_id: int,
    *,
    language: str | None,
    submission_type: Literal["submit", "autosave"],
    ip: str | None = None,
    import_errors: list[str] | None = None,
) -> tuple[RecordMetadata, ErrorCollection]:
    errors = validate_record(record, language=language)
    if import_errors:
        for msg in import_errors:
            errors.add(fields=[], code="import_error", message=msg)
    type_val = _determine_type(errors, submission_type)

    now = datetime.now()

    return (
        RecordMetadata(
            publ_id=publ_id,
            user_id=user_id,
            id=uuid4(),
            errors=errors.to_db_string(),
            type=type_val,
            created_at=now,
            updated_at=now,
            ip=ip,
        ),
        errors,
    )


def _flatten_for_db(data: RecordData) -> SpecimenDbRow:
    dumped = data.model_dump(exclude_unset=True, exclude={"specimens"})
    if data.specimens:
        flat = specimens_to_db(data.specimens)
        dumped.update(flat)
    return dumped


def _enrich_record(record: EventRecord) -> RecordFull:
    full = RecordFull.model_validate(record)
    specimens_list = specimens_from_record(record)
    if specimens_list:
        full.specimens = specimens_list
    return full
