import json
from collections.abc import AsyncIterable
from datetime import datetime
from typing import Annotated, Any, Literal
from uuid import UUID, uuid4

import asyncstdlib as a
from fastapi import Depends
from pydantic import BaseModel, Json

from core.config import settings
from core.dependencies import DBSession
from core.exceptions import (
    NoPublicationsAssignedError,
    PublicationForbiddenError,
    RecordForbiddenError,
    RecordLimitExceededError,
    RecordNotFoundError,
    RecordStaleError,
)
from core.model import EventRecord
from repository import record as repo
from repository.publication import get_publication
from repository.record import count_records_by_publ
from repository.user import get_user_expect
from schema.records import RecordData, RecordFull, RecordMetadata, RecordType
from service.actions import ActionService
from service.export import ParseResult, is_row_empty
from service.milestone import check_and_log_milestone
from service.publications import PublicationService
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


def create_record_metadata(
    record: RecordData | None,
    user_id: int,
    publ_id: int,
    *,
    language: str | None,
    submission_type: Literal["submit", "autosave"],
    ip: str | None = None,
    updated_at: datetime | None = None,
) -> tuple[RecordMetadata, ErrorCollection]:
    errors = validate_record(record, language=language)
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
            updated_at=updated_at if updated_at else now,
            ip=ip,
        ),
        errors,
    )


def _flatten_for_db(data: RecordData) -> dict:
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


class ImportError(BaseModel):
    row: int
    error: Json[Any]


class ImportResult(BaseModel):
    imported: int
    failed: int
    errors: list[ImportError]


class RecordService:
    def __init__(
        self,
        session: DBSession,
        publication_service: Annotated[PublicationService, Depends()],
        action_service: Annotated[ActionService, Depends()],
    ) -> None:
        self.session = session
        self.action_service = action_service
        self.publication_service = publication_service

    async def create_record(
        self,
        user_id: int,
        publ_id: int,
        ip: str | None = None,
        submission_type: Literal["submit", "autosave"] = "autosave",
    ) -> tuple[RecordFull, ErrorCollection]:
        """Create a new record (autosave by default, or submit)."""
        await self.publication_service.validate_access(publ_id, user_id=user_id)
        publ = await get_publication(self.session, publ_id)
        language = publ.language if publ else None
        metadata, errors = create_record_metadata(
            None,
            user_id=user_id,
            publ_id=publ_id,
            language=language,
            submission_type=submission_type,
            ip=ip,
        )

        record = await repo.create_record(self.session, metadata)
        return RecordFull.model_validate(record), errors

    async def update_record(
        self,
        record_id: UUID,
        user_id: int,
        data: RecordData,
        ip: str | None = None,
        submission_type: Literal["submit", "autosave"] = "autosave",
    ) -> tuple[RecordFull, ErrorCollection]:
        """Update a record with optimistic locking via updated_at."""
        record = await self._get_and_check_ownership(record_id, user_id)

        publ = await get_publication(self.session, record.publ_id)
        language = publ.language if publ else None

        metadata, errors = create_record_metadata(
            data,
            user_id=user_id,
            publ_id=record.publ_id,
            language=language,
            submission_type=submission_type,
            ip=ip,
            updated_at=record.updated_at,
        )

        flat = _flatten_for_db(data)
        updated = await repo.update_record(self.session, record_id, flat, metadata)
        if updated is None:
            raise RecordStaleError(record_id)

        if updated.type == "rec_ok":
            await check_and_log_milestone(
                self.session, user_id, updated, self.action_service
            )

        return _enrich_record(updated), errors

    async def get_record(
        self,
        record_id: UUID,
    ) -> RecordFull:
        """Get a record by ID"""
        record = await repo.get_record(self.session, record_id)
        if record is None:
            raise RecordNotFoundError(record_id)

        return _enrich_record(record)

    async def delete_record(
        self,
        record_id: UUID,
        user_id: int,
    ) -> None:
        """Delete a record, enforcing ownership and publication membership."""

        # FIXME: if record is rec_ok change type to rec_del instead of deleting.
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
            "items": [_enrich_record(r) for r in records],
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

        try:
            await self.publication_service.validate_access(record.publ_id, user=user)
        except PublicationForbiddenError as e:
            raise RecordForbiddenError from e

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
        ip: str | None,
    ) -> ImportResult:
        """Import records from parsed Excel/CSV rows."""
        event_records: list[EventRecord] = []
        all_errors: list[ImportError] = []
        last_ok = None

        user = await get_user_expect(self.session, user_id)
        if user.publ_id is None:
            raise NoPublicationsAssignedError(user_id)

        publ = await self.publication_service.validate_access(user.publ_id, user=user)

        async for i, result in a.enumerate(records, 1):
            if result["error"]:
                all_errors.append(ImportError(row=i, error=result["error"].json()))
                continue

            record_data = result["record"]
            if record_data is None or is_row_empty(record_data.model_dump()):
                all_errors.append(
                    ImportError(
                        row=i, error=json.dumps([{"msg": "Record data is empty"}])
                    )
                )
                continue

            metadata, _ = create_record_metadata(
                record_data,
                user_id,
                publ.publ_id,
                language=publ.language,
                submission_type="submit",
                ip=ip,
            )

            flat = _flatten_for_db(record_data)
            record = EventRecord(
                **flat,
                **metadata.model_dump(),
            )

            event_records.append(record)

            if metadata.type == "rec_ok":
                last_ok = record

        # FIXME: race condition - check and insert are not atomic.
        # Concurrent imports can exceed MAX_RECORDS_PER_PUBLICATION.
        await self.check_import_limit(publ.publ_id, len(event_records))

        self.session.add_all(event_records)
        await self.session.commit()

        if last_ok is not None:
            await check_and_log_milestone(
                self.session,
                user_id,
                # FIXME: This should be the exact record, that broke the record,
                # but here we use the last one, which might not be expected
                last_ok,
                self.action_service,
            )

        return ImportResult(
            imported=len(event_records),
            failed=len(all_errors),
            errors=all_errors,
        )
