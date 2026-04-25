from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app import app
from schemas.geo import RegionData, ReverseGeoCodeLocation


@pytest.fixture
def location_data() -> list[RegionData]:
    return [
        RegionData(region="Москва", districts=["Центральный", "Южный"]),
        RegionData(region="Московская область", districts=["Подольск", "Химки"]),
    ]


def setup_mock_location_data(data: list[RegionData]) -> None:
    app.state.location_data = data


class TestGeoSearch:
    def test_search_returns_200_with_locations(self) -> None:
        client = TestClient(app)
        data = [
            RegionData(region="Москва", districts=["Центральный", "Южный"]),
            RegionData(region="Московская область", districts=["Подольск", "Химки"]),
        ]
        setup_mock_location_data(data)

        response = client.get(
            "/api/geo/search",
            params={"field": "region", "text": "Москва"},
        )
        assert response.status_code == 200
        result = response.json()
        assert "suggestions" in result
        assert isinstance(result["suggestions"], list)

    def test_search_works_without_authentication(self) -> None:
        client = TestClient(app)
        data = [
            RegionData(region="Москва", districts=["Центральный", "Южный"]),
        ]
        setup_mock_location_data(data)

        response = client.get(
            "/api/geo/search",
            params={"field": "region", "text": "Москва"},
        )
        assert response.status_code == 200


class TestReverseGeocode:
    def test_reverse_geocode_returns_200(self) -> None:
        client = TestClient(app)

        mock_result = ReverseGeoCodeLocation(
            country="Россия",
            region="Москва",
            district="Центральный",
        )
        with patch("service.geo.get_location_names", return_value=mock_result):
            response = client.get(
                "/api/geo/reverse-geocode",
                params={
                    "degrees_n": 55,
                    "minutes_n": 45,
                    "seconds_n": 20,
                    "degrees_e": 37,
                    "minutes_e": 37,
                    "seconds_e": 0,
                },
            )
        assert response.status_code == 200
        result = response.json()
        assert "country" in result
        assert "region" in result
        assert "district" in result

    def test_reverse_geocode_works_without_authentication(self) -> None:
        client = TestClient(app)

        mock_result = ReverseGeoCodeLocation(
            country="Россия",
            region="Москва",
            district="Центральный",
        )
        with patch("service.geo.get_location_names", return_value=mock_result):
            response = client.get(
                "/api/geo/reverse-geocode",
                params={
                    "degrees_n": 55,
                    "minutes_n": 45,
                    "seconds_n": 20,
                    "degrees_e": 37,
                    "minutes_e": 37,
                    "seconds_e": 0,
                },
            )
        assert response.status_code == 200
