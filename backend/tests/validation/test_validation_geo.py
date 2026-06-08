"""Tests for geo validation rules (14 rules)."""

from unittest.mock import patch

import pytest

from schema.records import RecordData, Specimen
from service.records.validation import validate_record
from service.records.validation.constants import (
    COORD_UNCERTAINTY_MAX,
    COORD_UNCERTAINTY_MIN,
    GEOREF_SOURCES,
    REGION_LAT_MAX,
    REGION_LAT_MIN,
    REGION_LON_MAX,
    REGION_LON_MIN,
)
from service.records.validation.rules import RuleCategory

GEO_PATCH = "service.records.validation.rules.geo"


def _valid_data(**overrides: object) -> RecordData:
    data = RecordData(
        family="Formicidae",
        genus="Camponotus",
        species="herculeanus",
        tax_verbatim=False,
        georef_source="lit",
        latitude="55.55",
        longitude="60.55",
        coordinate_uncertainty=100.0,
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


class TestGeoValidation:
    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_all_geo_valid(self, _m) -> None:
        data = _valid_data()
        errors = validate_record(data, language="rus")
        geo_errors = [e for e in errors.errors if e.category == RuleCategory.GEO]
        assert geo_errors == []

    # ── Required ───────────────────────────────────────────────────────

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_latitude_required(self, _m) -> None:
        data = _valid_data(latitude=None)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "required" and "latitude" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_longitude_required(self, _m) -> None:
        data = _valid_data(longitude=None)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "required" and "longitude" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_georef_source_required(self, _m) -> None:
        data = _valid_data(georef_source=None)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "required" and "georef_source" in (e.fields or [])
            for e in errors.errors
        )

    # ── Coordinate precision (from verbatimcoordinates) ────────────────

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_lat_insufficient_precision(self, _m) -> None:
        data = _valid_data(verbatimcoordinates="55° .' N, 60° 55' E")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "precision" and "latitude" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_lat_excess_precision(self, _m) -> None:
        data = _valid_data(verbatimcoordinates="55° 30.12345' N, 60° 55' E")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "precision" and "latitude" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_lon_insufficient_precision(self, _m) -> None:
        data = _valid_data(verbatimcoordinates="55° 55' N, 60° .' E")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "precision" and "longitude" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_lon_excess_precision(self, _m) -> None:
        data = _valid_data(verbatimcoordinates="55° 55' N, 60° 30.12345' E")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "precision" and "longitude" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_dm_valid_precision(self, _m) -> None:
        """DM input passes both precision checks."""
        data = _valid_data(verbatimcoordinates="55° 30' N, 60° 55' E")
        errors = validate_record(data, language="rus")
        assert not any(e.code == "precision" for e in errors.errors)

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_dms_valid_precision(self, _m) -> None:
        """DMS input passes both precision checks."""
        data = _valid_data(verbatimcoordinates="55° 30' 45'' N, 60° 55' 30'' E")
        errors = validate_record(data, language="rus")
        assert not any(e.code == "precision" for e in errors.errors)

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_no_verbatim_skips_precision(self, _m) -> None:
        """Map/DD input without verbatimcoordinates skips precision checks."""
        data = _valid_data(latitude="55.5")
        errors = validate_record(data, language="rus")
        assert not any(e.code == "precision" for e in errors.errors)

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    @pytest.mark.parametrize(
        "coord_str",
        [
            "55°30' N,60° 55' E",
            "55° 30'  N, 60°55' E",
        ],
    )
    def test_verbatim_irregular_spacing(self, _m, coord_str: str) -> None:
        """Irregular spacing in verbatimcoordinates still passes precision."""
        data = _valid_data(verbatimcoordinates=coord_str)
        errors = validate_record(data, language="rus")
        assert not any(e.code == "precision" for e in errors.errors)

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    @pytest.mark.parametrize("field", ["latitude", "longitude"])
    def test_blank_lat_lon_with_verbatim(self, _m, field: str) -> None:
        """Blank lat/lon with verbatimcoordinates yields required, not out_of_range."""
        data = _valid_data(**{field: ""}, verbatimcoordinates="55° 30' N, 60° 55' E")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "required" and field in (e.fields or []) for e in errors.errors
        )
        assert not any(
            e.code == "out_of_range" and field in (e.fields or [])
            for e in errors.errors
        )

    # ── Coordinate uncertainty ─────────────────────────────────────────

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_coordinate_uncertainty_below_min(self, _m) -> None:
        data = _valid_data(coordinate_uncertainty=COORD_UNCERTAINTY_MIN - 1)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "out_of_range" and "coordinate_uncertainty" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_coordinate_uncertainty_above_max(self, _m) -> None:
        data = _valid_data(coordinate_uncertainty=COORD_UNCERTAINTY_MAX + 1)
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "out_of_range" and "coordinate_uncertainty" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_coordinate_uncertainty_valid(self, _m) -> None:
        data = _valid_data(coordinate_uncertainty=100)
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "out_of_range" and "coordinate_uncertainty" in (e.fields or [])
            for e in errors.errors
        )

    # ── georef_source invalid ──────────────────────────────────────────

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_georef_source_invalid(self, _m) -> None:
        data = _valid_data(georef_source="gps")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "invalid" and "georef_source" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    @pytest.mark.parametrize("src", list(GEOREF_SOURCES))
    def test_georef_source_valid_values(self, _m, src: str) -> None:
        data = _valid_data(georef_source=src)
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "invalid" and "georef_source" in (e.fields or [])
            for e in errors.errors
        )

    # ── Region bounds (lat/lon out_of_range) ───────────────────────────

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_latitude_out_of_region_north(self, _m) -> None:
        data = _valid_data(latitude=str(REGION_LAT_MAX + 1))
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "out_of_range" and "latitude" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_latitude_out_of_region_south(self, _m) -> None:
        data = _valid_data(latitude=str(REGION_LAT_MIN - 1))
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "out_of_range" and "latitude" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_longitude_out_of_region_east(self, _m) -> None:
        data = _valid_data(longitude=str(REGION_LON_MAX + 1))
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "out_of_range" and "longitude" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_longitude_out_of_region_west(self, _m) -> None:
        data = _valid_data(longitude=str(REGION_LON_MIN - 1))
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "out_of_range" and "longitude" in (e.fields or [])
            for e in errors.errors
        )

    # ── Ural polygon containment ───────────────────────────────────────

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=False)
    def test_outside_ural_polygon(self, _m) -> None:
        data = _valid_data()
        errors = validate_record(data, language="rus")
        assert any(e.code == "out_of_region" for e in errors.errors)

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_inside_ural_polygon(self, _m) -> None:
        data = _valid_data()
        errors = validate_record(data, language="rus")
        assert not any(e.code == "out_of_region" for e in errors.errors)

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=False)
    def test_geo_skip_does_not_check_ural(self, _m) -> None:
        """When georef_source is 'none', Ural polygon check is skipped."""
        data = _valid_data(georef_source="none")
        errors = validate_record(data, language="rus")
        assert not any(e.code == "out_of_region" for e in errors.errors)

    # ── Should skip geo for all coord rules ─────────────────────────────

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_geo_skip_latitude_required(self, _m) -> None:
        """When georef_source is 'none', latitude required is skipped."""
        data = _valid_data(georef_source="none", latitude=None)
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "required" and "latitude" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_geo_skip_longitude_required(self, _m) -> None:
        """When georef_source is 'none', longitude required is skipped."""
        data = _valid_data(georef_source="none", longitude=None)
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "required" and "longitude" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_geo_skip_coord_uncertainty_min(self, _m) -> None:
        """When georef_source is 'none', uncertainty min check skipped."""
        data = _valid_data(
            georef_source="none",
            coordinate_uncertainty=COORD_UNCERTAINTY_MIN - 1,
        )
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "out_of_range" and "coordinate_uncertainty" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_geo_skip_coord_uncertainty_max(self, _m) -> None:
        """When georef_source is 'none', uncertainty max check skipped."""
        data = _valid_data(
            georef_source="none",
            coordinate_uncertainty=COORD_UNCERTAINTY_MAX + 1,
        )
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "out_of_range" and "coordinate_uncertainty" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_geo_skip_latitude_region(self, _m) -> None:
        """When georef_source is 'none', lat region bound check skipped."""
        data = _valid_data(
            georef_source="none",
            latitude=str(REGION_LAT_MAX + 1),
        )
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "out_of_range" and "latitude" in (e.fields or [])
            for e in errors.errors
        )

    @patch(f"{GEO_PATCH}.UralBorder.contains", return_value=True)
    def test_geo_skip_longitude_region(self, _m) -> None:
        """When georef_source is 'none', lon region bound check skipped."""
        data = _valid_data(
            georef_source="none",
            longitude=str(REGION_LON_MAX + 1),
        )
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "out_of_range" and "longitude" in (e.fields or [])
            for e in errors.errors
        )

    # ── Geo coords conflict ────────────────────────────────────────────

    def test_geo_coords_conflict(self) -> None:
        data = _valid_data(georef_source="none", latitude="55.0", longitude="37.0")
        errors = validate_record(data, language="rus")
        assert any(
            e.code == "conflict" and "georef_source" in (e.fields or [])
            for e in errors.errors
        )

    def test_geo_coords_conflict_zero_lat(self) -> None:
        data = _valid_data(georef_source="none", latitude="0", longitude="37.0")
        errors = validate_record(data, language="rus")
        assert not any(
            e.code == "conflict" and "georef_source" in (e.fields or [])
            for e in errors.errors
        )
