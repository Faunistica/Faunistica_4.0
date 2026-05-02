import pytest
from unittest.mock import patch

from schema.taxonomy import AutofillTaxonResponse, TaxonomyFilters
from service.taxon import suggest, autofill


@pytest.fixture
def mock_taxon_df():
    """Mock the dataframe used by taxon service."""
    import pandas as pd

    return pd.DataFrame(
        {
            "family": ["Felidae", "Felidae", "Canidae"],
            "genus": ["Felis", "Panthera", "Canis"],
            "species": ["catus", "leo", "lupus"],
        }
    )


def test_suggest_returns_matching_families(mock_taxon_df):
    with patch("service.taxon.df", mock_taxon_df):
        result = suggest("family", "fel", None)
        assert "Felidae" in result


def test_suggest_with_filters(mock_taxon_df):
    with patch("service.taxon.df", mock_taxon_df):
        filters = TaxonomyFilters(family="Felidae")
        result = suggest("genus", "fe", filters)
        assert "Felis" in result
        assert "Panthera" not in result  # Panthera doesn't contain "fe"
        assert "Canis" not in result


def test_suggest_with_genus_filter(mock_taxon_df):
    with patch("service.taxon.df", mock_taxon_df):
        filters = TaxonomyFilters(genus="Fel")
        result = suggest("species", "c", filters)
        assert "catus" in result
        assert "leo" not in result  # leo doesn't contain "c"
        assert "lupus" not in result


def test_suggest_no_match(mock_taxon_df):
    with patch("service.taxon.df", mock_taxon_df):
        result = suggest("genus", "nonexistent", None)
        assert result == []


def test_autofill_family_field():
    result = autofill("family", "Felidae")
    assert result.family == "Felidae"
    assert result.genus is None


def test_autofill_genus_field(mock_taxon_df):
    with patch("service.taxon.df", mock_taxon_df):
        result = autofill("genus", "Felis")
        assert result.family == "Felidae"
        assert result.genus == "Felis"


def test_autofill_no_match(mock_taxon_df):
    with patch("service.taxon.df", mock_taxon_df):
        result = autofill("genus", "Nonexistent")
        assert result.family is None
        assert result.genus is None
