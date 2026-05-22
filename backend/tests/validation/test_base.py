"""Tests for rule factories: required, in_set, in_range, min_length."""

from schema.records import RecordData
from service.records.validation.rules import RuleContext
from service.records.validation.rules.base import in_range, in_set, min_length, required


class TestRequired:
    def test_required_none(self) -> None:
        rule_fn = required("family", "error")
        data = RecordData(family=None)
        assert rule_fn(data, RuleContext()) == "error"

    def test_required_empty_string(self) -> None:
        rule_fn = required("family", "error")
        data = RecordData(family="")
        assert rule_fn(data, RuleContext()) == "error"

    def test_required_blank_string(self) -> None:
        rule_fn = required("family", "error")
        data = RecordData(family="   ")
        assert rule_fn(data, RuleContext()) == "error"

    def test_required_valid(self) -> None:
        rule_fn = required("family", "error")
        data = RecordData(family="Formicidae")
        assert rule_fn(data, RuleContext()) is None

    def test_required_nonexistent_field(self) -> None:
        rule_fn = required("nonexistent", "error")
        data = RecordData()
        assert rule_fn(data, RuleContext()) == "error"


class TestInSet:
    def test_in_set_valid(self) -> None:
        allowed = frozenset({"a", "b", "c"})
        rule_fn = in_set("taxon_rank", allowed, "error")
        data = RecordData(taxon_rank="a")
        assert rule_fn(data, RuleContext()) is None

    def test_in_set_invalid(self) -> None:
        allowed = frozenset({"a", "b", "c"})
        rule_fn = in_set("taxon_rank", allowed, "error")
        data = RecordData(taxon_rank="d")
        assert rule_fn(data, RuleContext()) == "error"

    def test_in_set_none(self) -> None:
        allowed = frozenset({"a", "b", "c"})
        rule_fn = in_set("taxon_rank", allowed, "error")
        data = RecordData(taxon_rank=None)
        assert rule_fn(data, RuleContext()) is None


class TestInRange:
    def test_in_range_within(self) -> None:
        rule_fn = in_range("coordinate_uncertainty", 0, 100, "error")
        data = RecordData(coordinate_uncertainty=50)
        assert rule_fn(data, RuleContext()) is None

    def test_in_range_below_min(self) -> None:
        rule_fn = in_range("coordinate_uncertainty", 10, 100, "error")
        data = RecordData(coordinate_uncertainty=5)
        assert rule_fn(data, RuleContext()) == "error"

    def test_in_range_above_max(self) -> None:
        rule_fn = in_range("coordinate_uncertainty", 10, 100, "error")
        data = RecordData(coordinate_uncertainty=200)
        assert rule_fn(data, RuleContext()) == "error"

    def test_in_range_none(self) -> None:
        rule_fn = in_range("coordinate_uncertainty", 10, 100, "error")
        data = RecordData(coordinate_uncertainty=None)
        assert rule_fn(data, RuleContext()) is None

    def test_in_range_no_min(self) -> None:
        rule_fn = in_range("coordinate_uncertainty", None, 100, "error")
        data = RecordData(coordinate_uncertainty=200)
        assert rule_fn(data, RuleContext()) == "error"

    def test_in_range_no_max(self) -> None:
        rule_fn = in_range("coordinate_uncertainty", 10, None, "error")
        data = RecordData(coordinate_uncertainty=5)
        assert rule_fn(data, RuleContext()) == "error"

    def test_in_range_convert_float_valid(self) -> None:
        rule_fn = in_range("latitude", 0, 90, "error", convert_to_float=True)
        data = RecordData(latitude="45.5")
        assert rule_fn(data, RuleContext()) is None

    def test_in_range_convert_float_invalid(self) -> None:
        rule_fn = in_range("latitude", 0, 90, "error", convert_to_float=True)
        data = RecordData(latitude="95.0")
        assert rule_fn(data, RuleContext()) == "error"

    def test_in_range_convert_float_bad_string(self) -> None:
        rule_fn = in_range("latitude", 0, 90, "error", convert_to_float=True)
        data = RecordData(latitude="abc")
        assert rule_fn(data, RuleContext()) == "error"

    def test_in_range_at_boundary(self) -> None:
        rule_fn = in_range("coordinate_uncertainty", 10, 100, "error")
        data = RecordData(coordinate_uncertainty=10)
        assert rule_fn(data, RuleContext()) is None
        data = RecordData(coordinate_uncertainty=100)
        assert rule_fn(data, RuleContext()) is None


class TestMinLength:
    def test_min_length_valid(self) -> None:
        rule_fn = min_length("region", 4, "error")
        data = RecordData(region="Moscow")
        assert rule_fn(data, RuleContext()) is None

    def test_min_length_too_short(self) -> None:
        rule_fn = min_length("region", 4, "error")
        data = RecordData(region="AB")
        assert rule_fn(data, RuleContext()) == "error"

    def test_min_length_none(self) -> None:
        rule_fn = min_length("region", 4, "error")
        data = RecordData(region=None)
        assert rule_fn(data, RuleContext()) is None

    def test_min_length_strips_whitespace(self) -> None:
        rule_fn = min_length("region", 4, "error")
        data = RecordData(region="  AB  ")
        assert rule_fn(data, RuleContext()) == "error"

    def test_min_length_exact(self) -> None:
        rule_fn = min_length("region", 4, "error")
        data = RecordData(region="ABCD")
        assert rule_fn(data, RuleContext()) is None
