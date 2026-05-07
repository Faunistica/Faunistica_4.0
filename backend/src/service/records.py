from collections.abc import AsyncIterable, Sequence
from datetime import datetime
from typing import Annotated, Literal, TypedDict
from uuid import UUID, uuid4

import asyncstdlib as a
from fastapi import Depends
from pydantic import BaseModel, Json

from core.config import settings
from core.dependencies import DBSession
from core.exceptions import (
    RecordForbiddenError,
    RecordLimitExceededError,
    RecordNotFoundError,
    RecordStaleError,
)
from core.model import EventRecord
from repository import record as repo
from repository.record import count_records_by_publ
from repository.user import get_user_expect
from schema.records import RecordData, RecordFull, RecordMetadata, RecordType
from service.actions import ActionService
from service.export import ParseResult
from service.milestone import check_and_log_milestone


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
    user_id: int,
    publ_id: int,
    *,
    submission_type: Literal["submit", "autosave"],
    ip: str | None = None,
    updated_at: datetime | None = None,
) -> RecordMetadata:
    errors = _mock_validate_record(record) if record else "Пустая запись"
    type_val = _determine_type(errors, submission_type) if record else "check_fail"

    now = datetime.now()

    return RecordMetadata(
        publ_id=publ_id,
        user_id=user_id,
        id=uuid4(),
        errors=errors,
        type=type_val,
        created_at=now,
        updated_at=updated_at if updated_at else now,
        ip=ip,
    )


class ImportError(BaseModel):
    row: int
    error: Json


class ImportResult(BaseModel):
    imported: int
    failed: int
    errors: list[ImportError]


class RecordService:
    def __init__(
        self, session: DBSession, action_service: Annotated[ActionService, Depends()]
    ) -> None:
        self.session = session
        self.action_service = action_service

    async def create_record(
        self,
        user_id: int,
        publ_id: int,
        ip: str | None = None,
        submission_type: Literal["submit", "autosave"] = "autosave",
    ) -> RecordFull:
        """Create a new record (autosave by default, or submit)."""
        metadata = create_record_metadata(
            None,
            user_id=user_id,
            publ_id=publ_id,
            submission_type=submission_type,
            ip=ip,
        )

        record = await repo.create_record(self.session, metadata)
        return RecordFull.model_validate(record)

    async def update_record(
        self,
        record_id: UUID,
        user_id: int,
        data: RecordData,
        ip: str | None = None,
        submission_type: Literal["submit", "autosave"] = "autosave",
    ) -> RecordFull:
        """Update a record with optimistic locking via updated_at."""
        record = await self._get_and_check_ownership(record_id, user_id)

        metadata = create_record_metadata(
            data,
            user_id=user_id,
            publ_id=record.publ_id,
            submission_type=submission_type,
            ip=ip,
            updated_at=record.updated_at,
        )

        updated = await repo.update_record(self.session, record_id, data, metadata)
        if updated is None:
            raise RecordStaleError(record_id)

        if updated.type == "rec_ok":
            await check_and_log_milestone(
                self.session, user_id, updated, self.action_service
            )

        return RecordFull.model_validate(updated)

    async def get_record(
        self,
        record_id: UUID,
    ) -> RecordFull:
        """Get a record by ID"""
        record = await repo.get_record(self.session, record_id)
        if record is None:
            raise RecordNotFoundError(record_id)

        return RecordFull.model_validate(record)

    async def delete_record(
        self,
        record_id: UUID,
        user_id: int,
    ) -> None:
        """Delete a record, enforcing ownership and publication membership."""
        record = await self._get_and_check_ownership(record_id, user_id)
        await repo.delete_record(self.session, record.id)

    async def list_records(
        self,
        user_id: int,
        publ_id: int | None,
        page: int = 1,
        page_size: int = 20,
        sort: Literal["created_at", "updated_at"] = "created_at",
    ) -> dict:
        """List records with pagination, filtered by user_id and publ_id."""
        records, total = await repo.get_records_paginated(
            self.session, user_id, publ_id, page=page, page_size=page_size, sort=sort
        )

        # TODO: Check math
        pages = (total + page_size - 1) // page_size if page_size > 0 else 0

        return {
            "items": [RecordFull.model_validate(r) for r in records],
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": pages,
        }

    async def _get_and_check_ownership(
        self,
        record_id: UUID,
        user_id: int,
    ) -> EventRecord:
        """
        Get record by ID
        Raise 404 if not found, 403 if not owner or publications don't match
        """

        # TODO: I can imagine there is a faster implementation
        user = await get_user_expect(self.session, user_id)
        record = await repo.get_record(self.session, record_id)

        if record is None:
            raise RecordNotFoundError(record_id)

        if record.user_id != user_id:
            raise RecordForbiddenError

        if record.publ_id != user.publ_id:
            raise RecordForbiddenError

        return record

    async def check_import_limit(self, publ_id: int, additional_count: int) -> None:
        """Raise exception if adding additional_count would exceed limit."""
        current_count = await count_records_by_publ(self.session, publ_id)
        if current_count + additional_count > settings.MAX_RECORDS_PER_PUBLICATION:
            raise RecordLimitExceededError(publ_id, current_count, additional_count)

    # TODO: check for duplicated?
    async def import_records(
        self,
        records: AsyncIterable[ParseResult],
        user_id: int,
        publ_id: int,
        ip: str | None,
    ) -> ImportResult:
        """Import records from parsed Excel/CSV rows."""
        event_records: list[EventRecord] = []
        all_errors: list[ImportError] = []

        async for i, result in a.enumerate(records, 1):
            if not result["success"]:
                all_errors.append(ImportError(row=i, error=result["errors"]))
                continue

            record_data = result["record"]
            if record_data is None:
                all_errors.append(ImportError(row=i, error=["Record data is None"]))
                continue

            metadata = create_record_metadata(
                record_data, user_id, publ_id, submission_type="submit", ip=ip
            )

            event_records.append(
                EventRecord(
                    **record_data.model_dump(exclude_unset=True),
                    **metadata.model_dump(),
                )
            )

        await self.check_import_limit(publ_id, len(event_records))

        self.session.add_all(event_records)
        await self.session.commit()

        return ImportResult(
            imported=len(event_records),
            failed=len(all_errors),
            errors=all_errors,
        )
