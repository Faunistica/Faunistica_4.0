"""Tests for helper functions: decimal_places, contains_cyrillic,
contains_forbidden_chars, has_range_separator, should_skip_geo,
has_cyrillic_in_foreign_text.
"""

import pytest

from schema.records import RecordData
from service.records.validation.helpers import (
    contains_cyrillic,
    contains_forbidden_chars,
    decimal_places,
    has_cyrillic_in_foreign_text,
    has_range_separator,
    should_skip_geo,
)


class TestDecimalPlaces:
    @pytest.mark.parametrize(
        ("value", "expected"),
        [
            ("55.5", 1),
            ("55.55", 2),
            ("55.555", 3),
            ("55", 0),
            ("0", 0),
            (55.5, 1),
            (55.55, 2),
            (55.555, 3),
            (55.0, 0),
            (55, 0),
            (0.0, 0),
            ("abc", 0),
            ("55.", 0),
        ],
    )
    def test_decimal_places(self, value: float | str, expected: int) -> None:
        assert decimal_places(value) == expected


class TestContainsCyrillic:
    @pytest.mark.parametrize(
        ("text", "expected"),
        [
            ("Привет", True),
            ("hello", False),
            ("héllo", False),
            ("", False),
            (None, False),
            ("test Привет", True),
            ("abc123", False),
            ("Ёжик", True),
            ("ёлка", True),
        ],
    )
    def test_contains_cyrillic(self, text: str | None, expected: bool) -> None:
        assert contains_cyrillic(text) is expected


class TestContainsForbiddenChars:
    @pytest.mark.parametrize(
        ("fields", "expected"),
        [
            (("hello", "world"), False),
            (("hello\tworld",), True),
            (("hello\nworld",), True),
            (("hello\rworld",), True),
            (("hello\fworld",), True),
            (("hello\vworld",), True),
            ((None, "world"), False),
            (("", ""), False),
            (("tab\there", "no_tab"), True),
        ],
    )
    def test_contains_forbidden_chars(
        self, fields: tuple, expected: bool
    ) -> None:
        assert contains_forbidden_chars(*fields) is expected


class TestHasRangeSeparator:
    @pytest.mark.parametrize(
        ("date_str", "expected"),
        [
            ("2020-01-01", True),
            ("2020/01/01", True),
            ("2020–2021", True),
            ("2020—2021", True),
            ("20200101", False),
            ("", False),
            (None, False),
            ("01.01.2020", False),
        ],
    )
    def test_has_range_separator(
        self, date_str: str | None, expected: bool
    ) -> None:
        assert has_range_separator(date_str) is expected


class TestShouldSkipGeo:
    @pytest.mark.parametrize(
        ("georef_source", "expected"),
        [
            (None, True),
            ("", True),
            ("  ", True),
            ("none", True),
            ("None", True),
            ("NONE", True),
            ("lit", False),
            ("vol", False),
            ("gps", False),
        ],
    )
    def test_should_skip_geo(self, georef_source: str | None, expected: bool) -> None:
        data = RecordData(georef_source=georef_source)
        assert should_skip_geo(data) is expected


class TestHasCyrillicInForeignText:
    @pytest.mark.parametrize(
        ("language", "fields", "expected"),
        [
            (None, ("hello",), False),
            ("rus", ("hello",), False),
            ("ukr", ("hello",), False),
            ("eng", ("hello",), False),
            ("eng", ("привет",), True),
            ("eng", ("hello", "привет"), True),
            ("eng", (None, "hello"), False),
            ("rus", ("привет",), False),
            ("eng", ("",), False),
        ],
    )
    def test_cyrillic_in_foreign(
        self, language: str | None, fields: tuple, expected: bool
    ) -> None:
        assert has_cyrillic_in_foreign_text(language, *fields) is expected
