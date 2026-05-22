"""Tests for abundance validation rules (5 rules)."""

import pytest

from schema.records import RecordData, Specimen
from service.records.validation import validate_record
from service.records.validation.constants import QUANTITY_MAX, QUANTITY_TYPES
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
        recorded_by="Ivanov",
        country="Россия",
        region="Московская область",
        district="Солнечногорский район",
        quantity_type="individuals",
        specimens=[
            Specimen(sex="male", life_stage="adult", count=1),
        ],
    )
    return data.model_copy(update=overrides)  # type: ignore[arg-type]


class TestAbundanceValidation:
    def test_all_abundance_valid(self) -> None:
        data = _valid_data()
        errors = validate_record(data, language="rus")
        abd_errors = [e for e in errors.errors if e.category == RuleCategory.ABUNDANCE]
        assert abd_errors == []

    # ── Total quantity max ─────────────────────────────────────────────

    def test_total_quantity_exceeds_max(self) -> None:
        data = _valid_data(
            specimens=[Specimen(sex="male", life_stage="adult", count=QUANTITY_MAX + 1)]
        )
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "out_of_range" and "specimens" in (e.fields or [])
            for e in errors.errors
        )

    def test_total_quantity_at_max_ok(self) -> None:
        data = _valid_data(
            specimens=[Specimen(sex="male", life_stage="adult", count=QUANTITY_MAX)]
        )
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "out_of_range" and "specimens" in (e.fields or [])
            for e in errors.errors
        )

    def test_total_quantity_multiple_specimens(self) -> None:
        data = _valid_data(
            specimens=[
                Specimen(sex="male", life_stage="adult", count=150),
                Specimen(sex="female", life_stage="adult", count=150),
            ]
        )
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "out_of_range" and "specimens" in (e.fields or [])
            for e in errors.errors
        )

    # ── Each count too low ─────────────────────────────────────────────

    def test_each_count_too_low(self) -> None:
        data = _valid_data(
            specimens=[Specimen(sex="male", life_stage="adult", count=0.0005)]
        )
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "too_low" and "specimens" in (e.fields or [])
            for e in errors.errors
        )

    def test_each_count_zero_is_ok(self) -> None:
        """Zero is not checked by too_low (it checks 0 < count < 0.001)."""
        data = _valid_data(
            specimens=[Specimen(sex="male", life_stage="adult", count=0)]
        )
        errors = validate_record(data, language="rus")
        assert not any(e.code == "too_low" for e in errors.errors)

    def test_each_count_normal_ok(self) -> None:
        data = _valid_data(
            specimens=[Specimen(sex="male", life_stage="adult", count=1)]
        )
        errors = validate_record(data, language="rus")
        assert not any(e.code == "too_low" for e in errors.errors)

    # ── Count negative ─────────────────────────────────────────────────

    def test_count_negative(self) -> None:
        data = _valid_data(
            specimens=[Specimen(sex="male", life_stage="adult", count=-1)]
        )
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "count_negative" and "specimens" in (e.fields or [])
            for e in errors.errors
        )

    def test_count_negative_zero_ok(self) -> None:
        data = _valid_data(
            specimens=[Specimen(sex="male", life_stage="adult", count=0)]
        )
        errors = validate_record(data, language="rus")
        assert not any(e.code == "count_negative" for e in errors.errors)

    # ── quantity_type invalid ──────────────────────────────────────────

    def test_quantity_type_invalid(self) -> None:
        data = _valid_data(quantity_type="bogus")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "invalid" and "quantity_type" in (e.fields or [])
            for e in errors.errors
        )

    @pytest.mark.parametrize("qt", list(QUANTITY_TYPES))
    def test_quantity_type_valid_values(self, qt: str) -> None:
        data = _valid_data(quantity_type=qt)
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "invalid" and "quantity_type" in (e.fields or [])
            for e in errors.errors
        )

    # ── Forbidden chars in occurrence remarks ──────────────────────────

    @pytest.mark.parametrize("field", ["occurrence_remarks", "identification_remarks"])
    def test_forbidden_chars_in_occurrence(self, field: str) -> None:
        kwargs = {field: "text\twith\ttab"}
        data = _valid_data(**kwargs)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "forbidden_chars" and e.category == RuleCategory.ABUNDANCE
            for e in errors.errors
        )

    def test_no_specimens_skips_abundance_checks(self) -> None:
        data = _valid_data(specimens=None)
        errors = validate_record(data, language="rus")
        abd_errors = [e for e in errors.errors if e.category == RuleCategory.ABUNDANCE]
        assert not abd_errors
