"""Tests for taxonomy validation rules (10 rules)."""

from unittest.mock import patch

import pytest

from schema.records import RecordData, Specimen
from service.records.validation import validate_record
from service.records.validation.constants import TAXON_RANKS, TYPE_STATUSES
from service.records.validation.rules import RuleCategory

TAXONOMY_PATCH = "service.records.validation.rules.taxonomy"


def _valid_data(**overrides: object) -> RecordData:
    data = RecordData(
        family="Formicidae",
        genus="Camponotus",
        species="herculeanus",
        taxon_rank="species",
        type_status="none",
        tax_verbatim=False,
        georef_source="lit",
        latitude="55.5",
        longitude="37.5",
        verbatim_date="2020-01-01",
        date_precision="день",
        recorded_by="Ivanov",
        country="Россия",
        region="Московская область",
        district="Солнечногорский район",
        quantity_type="individuals",
        specimens=[Specimen(sex="male", life_stage="adult", count=1)],
    )
    return data.model_copy(update=overrides)  # type: ignore[arg-type]


class TestTaxonomyValidation:
    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    def test_all_taxonomy_valid(self, _m1, _m2) -> None:
        data = _valid_data()
        errors = validate_record(data, language="rus")
        tax_errors = [e for e in errors.errors if e.category == RuleCategory.TAXONOMY]
        assert tax_errors == []

    # ── Required ───────────────────────────────────────────────────────

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    def test_family_required(self, _m1, _m2) -> None:
        data = _valid_data(family=None)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "required" and "family" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    def test_genus_required(self, _m1, _m2) -> None:
        data = _valid_data(genus=None)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "required" and "genus" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    def test_species_required(self, _m1, _m2) -> None:
        data = _valid_data(species=None)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "required" and "species" in (e.fields or [])
            for e in errors.errors
        )

    # ── Unknown combos ─────────────────────────────────────────────────

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=False)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    def test_family_genus_unknown(self, _m1, _m2) -> None:
        data = _valid_data()
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "unknown" and e.fields == ["genus"]
            for e in errors.errors
        )

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=False)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    def test_family_genus_unknown_verbatim_bypass(self, _m1, _m2) -> None:
        data = _valid_data(tax_verbatim=True)
        errors = validate_record(data, language="rus")
        assert not any(e.code == "unknown" for e in errors.errors)

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=False)
    def test_genus_species_unknown(self, _m1, _m2) -> None:
        data = _valid_data()
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "unknown" and e.fields == ["species"]
            for e in errors.errors
        )

    # ── taxon_rank invalid ─────────────────────────────────────────────

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    def test_taxon_rank_invalid(self, _m1, _m2) -> None:
        data = _valid_data(taxon_rank="invalid_rank")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "invalid" and "taxon_rank" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    @pytest.mark.parametrize("rank", list(TAXON_RANKS))
    def test_taxon_rank_valid_values(self, _m1, _m2, rank: str) -> None:
        data = _valid_data(taxon_rank=rank)
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "invalid" and "taxon_rank" in (e.fields or [])
            for e in errors.errors
        )

    # ── type_status invalid ────────────────────────────────────────────

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    def test_type_status_invalid(self, _m1, _m2) -> None:
        data = _valid_data(type_status="bogus")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "invalid" and "type_status" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    @pytest.mark.parametrize("ts", list(TYPE_STATUSES))
    def test_type_status_valid_values(self, _m1, _m2, ts: str) -> None:
        data = _valid_data(type_status=ts)
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "invalid" and "type_status" in (e.fields or [])
            for e in errors.errors
        )

    # ── type_status conflict with genus rank ───────────────────────────

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    def test_type_status_on_genus_rank(self, _m1, _m2) -> None:
        data = _valid_data(type_status="голотип", taxon_rank="genus")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "conflict" and e.fields == ["type_status"]
            for e in errors.errors
        )

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    def test_type_status_none_no_conflict(self, _m1, _m2) -> None:
        data = _valid_data(type_status="none", taxon_rank="genus")
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "conflict" and e.fields == ["type_status"]
            for e in errors.errors
        )

    # ── Forbidden chars in taxonomy fields ─────────────────────────────

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    @pytest.mark.parametrize(
        "field",
        ["family", "genus", "species", "accepted_name", "taxon_remarks", "identification_remarks"],
    )
    def test_forbidden_chars_in_taxonomy_field(self, _m1, _m2, field: str) -> None:
        kwargs = {field: "text\twith\ttab"}
        data = _valid_data(**kwargs)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "forbidden_chars" and e.category == RuleCategory.TAXONOMY
            for e in errors.errors
        )

    # ── Cyrillic in foreign text ──────────────────────────────────────

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    def test_cyrillic_in_taxonomy_foreign_language(self, _m1, _m2) -> None:
        data = _valid_data(family="Семейство", language="eng")
        errors = validate_record(data, language="eng")
        assert any(
            e.code == "cyrillic" and e.category == RuleCategory.TAXONOMY
            for e in errors.errors
        )

    @patch(f"{TAXONOMY_PATCH}.family_genus_known", return_value=True)
    @patch(f"{TAXONOMY_PATCH}.genus_species_known", return_value=True)
    def test_cyrillic_taxonomy_russian_language_ok(self, _m1, _m2) -> None:
        data = _valid_data(family="Семейство", language="rus")
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "cyrillic" and e.category == RuleCategory.TAXONOMY
            for e in errors.errors
        )
