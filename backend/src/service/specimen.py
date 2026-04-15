from service.util import clean_value


class SpecimenService:
    def parse(
        self, specimens: dict[str, float | None] | None
    ) -> tuple[str | None, int]:
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
                    int(count)
                    if isinstance(count, float) and count.is_integer()
                    else count
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

    # FIXME: I can't understand what this method does
    def num_of_specimen(self, specimens: dict | None) -> float | None:
        if not specimens:
            return 0
        count = 0
        counts = []
        counts[0] = clean_value(specimens.get("male_adult"))
        counts[1] = clean_value(specimens.get("female_adult"))
        counts[2] = clean_value(specimens.get("male_juvenile"))
        counts[3] = clean_value(specimens.get("female_juvenile"))
        counts[4] = clean_value(specimens.get("undefined_adult"))
        counts[5] = clean_value(specimens.get("undefined_juvenile"))
        for i in range(0, 6):
            if counts[i] is not None:
                count += counts[i]
        return count
