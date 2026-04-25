from schemas.taxonomy import SpecimenCounts


def parse(specimens: SpecimenCounts | None) -> tuple[str | None, int]:
    if specimens is None or not specimens.specimens:
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

    gender_maturity_map = {
        ("male", "adult"): "mmm",
        ("female", "adult"): "fff",
        ("male", "juvenile"): "ssm",
        ("female", "juvenile"): "ssf",
        ("undefined", "adult"): "adu",
        ("undefined", "juvenile"): "juv",
    }

    for spec in specimens.specimens:
        label = gender_maturity_map.get((spec.gender, spec.maturity))
        if label:
            add_entry(spec.count, label)

    if entries:
        all_whole = all(
            (isinstance(v, int) or (isinstance(v, float) and v.is_integer()))
            for v in values
        )
        result = " | ".join(entries)
        return result, int(total) if all_whole else round(total, 6)
    return None, 0
