from fastapi.testclient import TestClient

from app import app

client = TestClient(app)


def test_suggest_returns_200_with_suggestions():
    response = client.get("/api/taxonomy/suggest?field=family&text=fel")
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data


def test_autofill_returns_200():
    response = client.get("/api/taxonomy/autofill?field=family&text=fel")
    assert response.status_code == 200
    data = response.json()
    assert "family" in data or "genus" in data


def test_suggest_without_authentication():
    response = client.get("/api/taxonomy/suggest?field=genus&text=pan")
    assert response.status_code == 200


def test_autofill_without_authentication():
    response = client.get("/api/taxonomy/autofill?field=genus&text=pan")
    assert response.status_code == 200
