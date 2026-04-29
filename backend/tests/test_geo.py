from unittest.mock import patch

import pytest
from httpx import AsyncClient

from app import app
from schema.geo import RegionData, ReverseGeoCodeLocation


@pytest.mark.asyncio
async def test_search_returns_200_with_locations(async_client: AsyncClient) -> None:
    location_data = [
        RegionData(region="Москва", districts=["Центральный", "Южный"]),
        RegionData(region="Московская область", districts=["Подольск", "Химки"]),
    ]
    app.state.location_data = location_data

    response = await async_client.get(
        "/api/geo/search",
        params={"field": "region", "text": "Москва"},
    )
    assert response.status_code == 200
    result = response.json()
    assert "suggestions" in result
    assert isinstance(result["suggestions"], list)


@pytest.mark.asyncio
async def test_search_works_without_authentication(async_client: AsyncClient) -> None:
    location_data = [
        RegionData(region="Москва", districts=["Центральный", "Южный"]),
    ]
    app.state.location_data = location_data

    response = await async_client.get(
        "/api/geo/search",
        params={"field": "region", "text": "Москва"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_reverse_geocode_returns_200(async_client: AsyncClient) -> None:
    mock_result = ReverseGeoCodeLocation(
        country="Россия",
        region="Москва",
        district="Центральный",
    )
    with patch("service.geo.get_location_names", return_value=mock_result):
        response = await async_client.get(
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


@pytest.mark.asyncio
async def test_reverse_geocode_works_without_authentication(
    async_client: AsyncClient,
) -> None:
    mock_result = ReverseGeoCodeLocation(
        country="Россия",
        region="Москва",
        district="Центральный",
    )
    with patch("service.geo.get_location_names", return_value=mock_result):
        response = await async_client.get(
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
