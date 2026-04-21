from core.utils import clean_value


def parse(specimens: dict[str, float | None] | None) -> tuple[str | None, int]:
    if specimens is None:
        return None, 0

    entries = []
    total = 0
    values = []

    def add_entry(count: float | None, label: str) -> None:
        nonlocal total
        if count is not None and count != 0:
            values.append(count)
            num = (
                int(count) if isinstance(count, float) and count.is_integer() else count
            )
            entries.append(f"{num} {label}")
            total += count

    add_entry(specimens.get("male_adult"), "mmm")
    add_entry(specimens.get("female_adult"), "fff")
    add_entry(specimens.get("male_juvenile"), "ssm")
    add_entry(specimens.get("female_juvenile"), "ssf")
    add_entry(specimens.get("undefined_adult"), "adu")
    add_entry(specimens.get("undefined_juvenile"), "juv")

    if entries:
        all_whole = all(
            (isinstance(v, int) or (isinstance(v, float) and v.is_integer()))
            for v in values
        )
        result = " | ".join(entries)
        return result, int(total) if all_whole else round(total, 6)
    return None, 0
