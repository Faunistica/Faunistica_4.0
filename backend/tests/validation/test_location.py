"""Tests for location validation rules (5 rules)."""

import pytest

from schema.records import RecordData, Specimen
from service.records.validation import validate_record
from service.records.validation.constants import SHORT_COUNTRY_ALLOWLIST
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
        locality=" nearby river",
        quantity_type="individuals",
        specimens=[Specimen(sex="male", life_stage="adult", count=1)],
    )
    return data.model_copy(update=overrides)  # type: ignore[arg-type]


class TestLocationValidation:
    def test_all_location_valid(self) -> None:
        data = _valid_data()
        errors = validate_record(data, language="rus")
        loc_errors = [e for e in errors.errors if e.category == RuleCategory.LOCATION]
        assert loc_errors == []

    # ── Forbidden chars ────────────────────────────────────────────────

    @pytest.mark.parametrize(
        "field", ["country", "region", "district", "locality", "location_remarks"]
    )
    def test_forbidden_chars_in_location_field(self, field: str) -> None:
        kwargs = {field: "text\twith\ttab"}
        data = _valid_data(**kwargs)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "forbidden_chars" and e.category == RuleCategory.LOCATION
            for e in errors.errors
        )

    # ── Cyrillic in foreign text ──────────────────────────────────────

    def test_cyrillic_in_location_foreign_language(self) -> None:
        data = _valid_data(country="Россия", language="eng")
        errors = validate_record(data, language="eng")
        assert any(
            e.code == "cyrillic" and e.category == RuleCategory.LOCATION
            for e in errors.errors
        )

    def test_cyrillic_location_russian_ok(self) -> None:
        data = _valid_data(country="Россия", language="rus")
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "cyrillic" and e.category == RuleCategory.LOCATION
            for e in errors.errors
        )

    # ── Min length: country ────────────────────────────────────────────

    def test_country_too_short(self) -> None:
        data = _valid_data(country="AB")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "too_short" and "country" in (e.fields or [])
            for e in errors.errors
        )

    def test_country_in_allowlist_ok(self) -> None:
        for short in SHORT_COUNTRY_ALLOWLIST:
            data = _valid_data(country=short)
            errors = validate_record(data, language="rus")
            assert not any(
                e.code == "too_short" and "country" in (e.fields or [])
                for e in errors.errors
            )

    def test_country_exact_min_length_ok(self) -> None:
        data = _valid_data(country="ABCD")
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "too_short" and "country" in (e.fields or [])
            for e in errors.errors
        )

    # ── Min length: region ─────────────────────────────────────────────

    def test_region_too_short(self) -> None:
        data = _valid_data(region="AB")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "too_short" and "region" in (e.fields or [])
            for e in errors.errors
        )

    def test_region_valid(self) -> None:
        data = _valid_data(region="Московская область")
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "too_short" and "region" in (e.fields or [])
            for e in errors.errors
        )

    # ── Min length: district ───────────────────────────────────────────

    def test_district_too_short(self) -> None:
        data = _valid_data(district="AB")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "too_short" and "district" in (e.fields or [])
            for e in errors.errors
        )

    def test_district_valid(self) -> None:
        data = _valid_data(district="Солнечногорский район")
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "too_short" and "district" in (e.fields or [])
            for e in errors.errors
        )
