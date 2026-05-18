import json
from collections.abc import AsyncIterable
from typing import Annotated, Any, Literal
from uuid import UUID

import asyncstdlib as a
from fastapi import Depends
from pydantic import BaseModel, Json

from core.config import settings
from core.dependencies import DBSession
from core.exceptions import (
    ImportLimitExceededError,
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
from repository.record import count_records_by_user_publ
from repository.user import get_user_expect
from schema.common import PaginatedResponse
from schema.records import (
    RecordData,
    RecordFull,
)
from service.actions import ActionService
from service.export import ParseResult, is_row_empty
from service.milestone import check_and_log_milestone
from service.publications import PublicationService
from service.records.validation.errors import ErrorCollection

from .util import _create_record_metadata, _enrich_record, _flatten_for_db


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
        count = await count_records_by_user_publ(self.session, user_id, publ_id)
        if count >= settings.MAX_USER_RECORDS_PER_PUBLICATION:
            raise RecordLimitExceededError(
                publ_id,
                current_count=count,
                additional=1,
                limit=settings.MAX_USER_RECORDS_PER_PUBLICATION,
            )

        publ = await get_publication(self.session, publ_id)
        language = publ.language if publ else None
        metadata, errors = _create_record_metadata(
            None,
            user_id=user_id,
            publ_id=publ_id,
            language=language,
            submission_type=submission_type,
            ip=ip,
        )

        record = await repo.create_record(self.session, metadata)
        await self.session.commit()

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

        metadata, errors = _create_record_metadata(
            data,
            user_id=user_id,
            publ_id=record.publ_id,
            language=language,
            submission_type=submission_type,
            ip=ip,
        )

        flat = _flatten_for_db(data)
        updated = await repo.update_record(
            self.session, record_id, flat, metadata, previous_update=record.updated_at
        )
        if updated is None:
            raise RecordStaleError(record_id)

        if updated.type == "rec_ok":
            await check_and_log_milestone(
                self.session, user_id, updated, self.action_service
            )
        await self.session.commit()

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
        """Delete a record, enforcing ownership and publication membership.

        If record type is rec_ok, soft-delete by changing type to rec_del.
        Otherwise, hard-delete.
        """
        record = await self._get_and_check_ownership(record_id, user_id)
        if record.type == "rec_ok":
            record.type = "rec_del"
        else:
            await repo.delete_record(self.session, record.id)

        await self.session.commit()

    async def list_records(
        self,
        user_id: int,
        publ_id: int | None,
        page: int = 1,
        page_size: int = 20,
        sort: Literal["created_at", "updated_at"] = "created_at",
    ) -> PaginatedResponse[RecordFull]:
        """List records with pagination, filtered by user_id and publ_id."""
        records, total = await repo.get_records_paginated(
            self.session, user_id, publ_id, page=page, page_size=page_size, sort=sort
        )

        # TODO: Check math
        pages = (total + page_size - 1) // page_size if page_size > 0 else 0

        return PaginatedResponse(
            items=[_enrich_record(r) for r in records],
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

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

        return record

    async def import_records(
        self,
        records: AsyncIterable[ParseResult],
        user_id: int,
        ip: str | None,
        total_count: int,
    ) -> ImportResult:
        """Import records from parsed Excel/CSV rows."""
        user = await get_user_expect(self.session, user_id)
        queue = await self.publication_service.get_current(user=user)
        if len(queue) == 0:
            raise NoPublicationsAssignedError(user_id)

        publ = queue[0]

        # Always ok now, but rules may change
        await self.publication_service.validate_access(publ.publ_id, user=user)

        if total_count > settings.MAX_USER_RECORDS_PER_PUBLICATION:
            raise ImportLimitExceededError(
                publ.publ_id, total_count, settings.MAX_USER_RECORDS_PER_PUBLICATION
            )

        event_records: list[EventRecord] = []
        all_errors: list[ImportError] = []
        last_ok = None

        async for i, (record_data, error) in a.enumerate(records, 1):
            if error:
                all_errors.append(ImportError(row=i, error=error.json()))

            if record_data is None or is_row_empty(record_data.model_dump()):
                if not error:
                    all_errors.append(
                        ImportError(
                            row=i, error=json.dumps([{"msg": "Record data is empty"}])
                        )
                    )
                continue

            metadata, _ = _create_record_metadata(
                record_data,
                user_id,
                publ.publ_id,
                language=publ.language,
                submission_type="submit",
                ip=ip,
                import_errors=["Ошибка при импорте"] if error else None,
            )

            flat = _flatten_for_db(record_data)
            record = EventRecord(
                **flat,
                **metadata.model_dump(),
            )

            event_records.append(record)

            if metadata.type == "rec_ok":
                last_ok = record

        # Delete old records, then insert — all in one transaction
        await repo.delete_records_by_user_and_publ(self.session, user_id, publ.publ_id)

        self.session.add_all(event_records)

        if last_ok is not None:
            await check_and_log_milestone(
                self.session,
                user_id,
                # FIXME: This should be the exact record, that broke the record,
                # but here we use the last one, which might not be expected
                last_ok,
                self.action_service,
            )

        await self.session.commit()

        return ImportResult(
            imported=len(event_records),
            failed=len(all_errors),
            errors=all_errors,
        )
