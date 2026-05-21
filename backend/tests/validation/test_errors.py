"""Tests for ErrorCollection and RecordValidationError."""

from service.records.validation.errors import ErrorCollection
from service.records.validation.rules import RuleCategory


class TestErrorCollection:
    def test_empty_collection(self) -> None:
        ec = ErrorCollection()
        assert not ec.has_errors()
        assert ec.to_db_string() is None
        assert ec.to_list() == []

    def test_add_error(self) -> None:
        ec = ErrorCollection()
        ec.add(["family"], "required", "Семейство обязательно", RuleCategory.TAXONOMY)
        assert ec.has_errors()
        assert len(ec.errors) == 1
        err = ec.errors[0]
        assert err.fields == ["family"]
        assert err.code == "required"
        assert err.message == "Семейство обязательно"
        assert err.category == RuleCategory.TAXONOMY

    def test_db_string(self) -> None:
        ec = ErrorCollection()
        ec.add(["family"], "required", "Family required")
        ec.add(["genus"], "required", "Genus required")
        result = ec.to_db_string()
        assert result == "Family required | Genus required"

    def test_multiple_categories(self) -> None:
        ec = ErrorCollection()
        ec.add(["lat"], "required", "Lat required", RuleCategory.GEO)
        ec.add(["family"], "required", "Family required", RuleCategory.TAXONOMY)
        assert len(ec.errors) == 2
        assert ec.errors[0].category == RuleCategory.GEO
        assert ec.errors[1].category == RuleCategory.TAXONOMY
