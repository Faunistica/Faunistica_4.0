"""Tests for event validation rules (8 rules)."""

import pytest

from schema.records import RecordData, Specimen
from service.records.validation import validate_record
from service.records.validation.constants import DATE_PRECISIONS
from service.records.validation.rules import RuleCategory


def _valid_data(**overrides: object) -> RecordData:
    data = RecordData(
        family="Formicidae",
        genus="Camponotus",
        species="herculeanus",
        georef_source="lit",
        latitude="55.55",
        longitude="37.55",
        verbatim_date="2020-01-01",
        date_precision="день",
        is_interval=False,
        recorded_by="Ivanov",
        habitat="forest",
        sampling_protocol="hand collecting",
        sampling_effort="2 hours",
        sample_size_value=10.0,
        sample_size_unit="individuals",
        country="Россия",
        region="Московская область",
        district="Солнечногорский район",
        quantity_type="individuals",
        specimens=[Specimen(sex="male", life_stage="adult", count=1)],
    )
    return data.model_copy(update=overrides)  # type: ignore[arg-type]


class TestEventValidation:
    def test_all_event_valid(self) -> None:
        data = _valid_data()
        errors = validate_record(data, language="rus")
        event_errors = [e for e in errors.errors if e.category == RuleCategory.EVENT]
        assert event_errors == []

    # ── Required ───────────────────────────────────────────────────────

    def test_verbatim_date_required(self) -> None:
        data = _valid_data(verbatim_date=None)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "required" and "verbatim_date" in (e.fields or [])
            for e in errors.errors
        )

    # ── date_precision invalid ─────────────────────────────────────────

    def test_date_precision_invalid(self) -> None:
        data = _valid_data(date_precision="bogus")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "invalid" and "date_precision" in (e.fields or [])
            for e in errors.errors
        )

    @pytest.mark.parametrize("dp", list(DATE_PRECISIONS))
    def test_date_precision_valid_values(self, dp: str) -> None:
        data = _valid_data(date_precision=dp)
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "invalid" and "date_precision" in (e.fields or [])
            for e in errors.errors
        )

    # ── Interval without separator ─────────────────────────────────────

    def test_interval_without_separator(self) -> None:
        data = _valid_data(is_interval=True, verbatim_date="20200101")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "conflict" and "verbatim_date" in (e.fields or [])
            for e in errors.errors
        )

    def test_interval_with_separator_ok(self) -> None:
        data = _valid_data(is_interval=True, verbatim_date="2020-2021")
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "conflict" and "verbatim_date" in (e.fields or [])
            for e in errors.errors
        )

    def test_not_interval_no_separator_ok(self) -> None:
        data = _valid_data(is_interval=False, verbatim_date="20200101")
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "conflict" and "verbatim_date" in (e.fields or [])
            for e in errors.errors
        )

    # ── Date precision without date ────────────────────────────────────

    def test_date_precision_no_date(self) -> None:
        data = _valid_data(date_precision="день", verbatim_date=None)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "conflict" and "date_precision" in (e.fields or [])
            for e in errors.errors
        )

    def test_date_precision_with_date_ok(self) -> None:
        data = _valid_data(date_precision="день", verbatim_date="2020-01-01")
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "conflict" and "date_precision" in (e.fields or [])
            for e in errors.errors
        )

    # ── recorded_by required ───────────────────────────────────────────

    def test_recorded_by_required_none(self) -> None:
        data = _valid_data(recorded_by=None)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "required" and "recorded_by" in (e.fields or [])
            for e in errors.errors
        )

    def test_recorded_by_required_empty(self) -> None:
        data = _valid_data(recorded_by="")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "required" and "recorded_by" in (e.fields or [])
            for e in errors.errors
        )

    def test_recorded_by_required_too_short(self) -> None:
        data = _valid_data(recorded_by="AB")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "required" and "recorded_by" in (e.fields or [])
            for e in errors.errors
        )

    # ── Forbidden chars ────────────────────────────────────────────────

    @pytest.mark.parametrize(
        "field",
        [
            "habitat",
            "sampling_protocol",
            "sampling_effort",
            "sample_size_unit",
            "event_remarks",
            "recorded_by",
        ],
    )
    def test_forbidden_chars_in_event_field(self, field: str) -> None:
        kwargs = {field: "text\twith\ttab"}
        data = _valid_data(**kwargs)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "forbidden_chars" and e.category == RuleCategory.EVENT
            for e in errors.errors
        )

    def test_forbidden_chars_in_sample_size_value(self) -> None:
        data = _valid_data(sample_size_value=12.5)
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "forbidden_chars" and e.category == RuleCategory.EVENT
            for e in errors.errors
        )

    # ── Cyrillic in event foreign text ─────────────────────────────────

    def test_cyrillic_in_event_foreign_language(self) -> None:
        data = _valid_data(habitat="лес", language="eng")
        errors = validate_record(data, language="eng")
        assert any(
            e.code == "cyrillic" and e.category == RuleCategory.EVENT
            for e in errors.errors
        )

    def test_cyrillic_event_russian_ok(self) -> None:
        data = _valid_data(habitat="лес", language="rus")
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "cyrillic" and e.category == RuleCategory.EVENT
            for e in errors.errors
        )

    # ── sample_size_value must be positive ─────────────────────────────

    def test_sample_size_zero(self) -> None:
        data = _valid_data(sample_size_value=0)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "out_of_range" and "sample_size_value" in (e.fields or [])
            for e in errors.errors
        )

    def test_sample_size_negative(self) -> None:
        data = _valid_data(sample_size_value=-5)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "out_of_range" and "sample_size_value" in (e.fields or [])
            for e in errors.errors
        )

    def test_sample_size_positive_ok(self) -> None:
        data = _valid_data(sample_size_value=5)
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "out_of_range" and "sample_size_value" in (e.fields or [])
            for e in errors.errors
        )
