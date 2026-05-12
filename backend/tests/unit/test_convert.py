"""Tests for lossless structured DB pipe format conversion."""
import pytest
from service.records.convert import specimens_to_db, specimens_from_db, specimens_to_flat


def test_roundtrip_single_specimen():
    specimens = [{"sex": "male", "life_stage": "adult", "count": 5}]
    db = specimens_to_db(specimens)
    assert db["quantity"] == 5
    assert db["sex"] == "5 adult male"
    assert db["life_stage"] == "5 adult male"
    result = specimens_from_db(db["quantity"], db["sex"], db["life_stage"])
    assert result == specimens


def test_roundtrip_mixed_sexes_same_stage():
    specimens = [
        {"sex": "male", "life_stage": "adult", "count": 3},
        {"sex": "female", "life_stage": "adult", "count": 2},
    ]
    db = specimens_to_db(specimens)
    assert db["quantity"] == 5
    assert "male" in db["sex"] and "female" in db["sex"]
    result = specimens_from_db(db["quantity"], db["sex"], db["life_stage"])
    assert sorted(result, key=lambda x: x["sex"]) == sorted(specimens, key=lambda x: x["sex"])


def test_roundtrip_mixed_sexes_mixed_stages():
    specimens = [
        {"sex": "male", "life_stage": "adult", "count": 3},
        {"sex": "male", "life_stage": "juvenile", "count": 1},
        {"sex": "female", "life_stage": "adult", "count": 2},
    ]
    db = specimens_to_db(specimens)
    result = specimens_from_db(db["quantity"], db["sex"], db["life_stage"])
    assert sorted(result, key=lambda x: (x["sex"], x["life_stage"])) == sorted(specimens, key=lambda x: (x["sex"], x["life_stage"]))


def test_roundtrip_with_none_sex():
    specimens = [
        {"sex": "none", "life_stage": "juvenile", "count": 4},
        {"sex": "male", "life_stage": "adult", "count": 3},
    ]
    db = specimens_to_db(specimens)
    result = specimens_from_db(db["quantity"], db["sex"], db["life_stage"])
    assert sorted(result, key=lambda x: x["sex"]) == sorted(specimens, key=lambda x: x["sex"])


def test_roundtrip_with_none_lifestage():
    specimens = [
        {"sex": "male", "life_stage": "none", "count": 2},
        {"sex": "female", "life_stage": "adult", "count": 3},
    ]
    db = specimens_to_db(specimens)
    result = specimens_from_db(db["quantity"], db["sex"], db["life_stage"])
    assert sorted(result, key=lambda x: x["sex"]) == sorted(specimens, key=lambda x: x["sex"])


def test_specimens_to_flat_keys():
    specimens = [{"sex": "male", "life_stage": "adult", "count": 3}]
    flat = specimens_to_flat(specimens)
    assert "organismquantity" in flat
    assert "sex" in flat
    assert "lifestage" in flat


def test_empty_specimens():
    assert specimens_to_db([]) == {}
    assert specimens_from_db(None, None, None) == []
