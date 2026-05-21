"""Integration tests for validate_record() entry point and all_rules()."""

from unittest.mock import patch

import pytest

from schema.records import RecordData, Specimen
from service.records.validation import validate_record
from service.records.validation.errors import RecordValidationError
from service.records.validation.rules import Rule, RuleCategory
from service.records.validation.rules.base import all_rules

GEO_PATCH = "service.records.validation.rules.geo"
TAX_PATCH = "service.records.validation.rules.taxonomy"


class TestValidateRecord:
    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    @patch(f"{TAX_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAX_PATCH}.genus_species_known", return_value=True)
    def test_fully_valid_record(self, _m1, _m2, _m3) -> None:
        data = RecordData(
            family="Formicidae",
            genus="Camponotus",
            species="herculeanus",
            taxon_rank="species",
            type_status="none",
            georef_source="lit",
            latitude="55.55",
            longitude="60.55",
            coordinate_uncertainty=100,
            verbatim_date="2020-01-01",
            date_precision="день",
            recorded_by="Ivanov",
            country="Россия",
            region="Московская область",
            district="Солнечногорский район",
            quantity_type="individuals",
            specimens=[Specimen(sex="male", life_stage="adult", count=1)],
        )
        errors = validate_record(data, language="rus")
        assert not errors.has_errors()

    def test_empty_record_data(self) -> None:
        errors = validate_record(None)
        assert errors.has_errors()
        assert any(e.code == "EMPTY" for e in errors.errors)

    def test_all_fields_none(self) -> None:
        errors = validate_record(RecordData(), language="rus")
        assert errors.has_errors()

    def test_error_categories_present(self) -> None:
        errors = validate_record(RecordData(), language="rus")
        categories = {e.category for e in errors.errors}
        assert RuleCategory.TAXONOMY in categories
        assert RuleCategory.GEO in categories

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    @patch(f"{TAX_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAX_PATCH}.genus_species_known", return_value=True)
    def test_language_none_does_not_crash(self, _m1, _m2, _m3) -> None:
        data = RecordData(
            family="Formicidae",
            genus="Camponotus",
            species="herculeanus",
            georef_source="lit",
            latitude="55.55",
            longitude="37.55",
            verbatim_date="2020-01-01",
            recorded_by="Ivanov",
        )
        errors = validate_record(data, language=None)
        assert errors.has_errors()

    def test_to_db_string_when_errors(self) -> None:
        data = RecordData(
            family="Formicidae",
            genus="Camponotus",
            species="herculeanus",
        )
        with (
            patch(f"{TAX_PATCH}.family_genus_known", return_value=True),
            patch(f"{TAX_PATCH}.genus_species_known", return_value=True),
        ):
            errors = validate_record(data, language=None)
            db_string = errors.to_db_string()
            if errors.has_errors():
                assert db_string is not None
            else:
                assert db_string is None

    def test_error_list_contains_record_validation_error(self) -> None:
        errors = validate_record(RecordData(), language="rus")
        for err in errors.to_list():
            assert isinstance(err, RecordValidationError)

    def test_rule_codes_are_strings(self) -> None:
        errors = validate_record(RecordData(), language="rus")
        for err in errors.errors:
            assert isinstance(err.code, str)
            assert err.code

    def test_rule_messages_are_strings(self) -> None:
        errors = validate_record(RecordData(), language="rus")
        for err in errors.errors:
            assert isinstance(err.message, str)
            assert err.message


class TestAllRules:
    def test_all_rules_non_empty(self) -> None:
        rules = all_rules()
        assert len(rules) > 0

    def test_each_rule_has_required_attributes(self) -> None:
        for rule_obj in all_rules():
            assert isinstance(rule_obj, Rule)
            assert isinstance(rule_obj.category, RuleCategory)
            assert isinstance(rule_obj.fields, list)
            assert isinstance(rule_obj.code, str)
            assert callable(rule_obj.func)

    @pytest.mark.parametrize("expected_category", list(RuleCategory))
    def test_each_category_has_rules(self, expected_category: RuleCategory) -> None:
        rules = [r for r in all_rules() if r.category == expected_category]
        assert len(rules) > 0, f"No rules for category {expected_category}"

