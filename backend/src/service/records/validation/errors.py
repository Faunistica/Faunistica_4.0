from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class RecordValidationError:
    field: str
    code: str
    message: str


@dataclass
class ErrorCollection:
    errors: list[RecordValidationError] = field(default_factory=list)

    def add(self, field: str, code: str, message: str) -> None:
        self.errors.append(
            RecordValidationError(field=field, code=code, message=message)
        )

    def has_errors(self) -> bool:
        return bool(self.errors)

    def to_db_string(self) -> str | None:
        if not self.errors:
            return None
        return " | ".join(e.message for e in self.errors)

    def to_list(self) -> list[RecordValidationError]:
        return self.errors
