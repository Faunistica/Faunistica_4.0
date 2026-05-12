from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from core.model import EventRecord

from schema.records import Specimen

from .validation.constants import SEX_VALUES


def _fmt_count(c: float) -> str:
    if isinstance(c, float) and c == int(c):
        return str(int(c))
    return str(c)


def specimens_to_db(specimens: list[Specimen]) -> dict:
    if not specimens:
        return {}

    collapsed: dict[tuple[str, str], float] = {}
    for s in specimens:
        key = (s.sex, s.life_stage)
        collapsed[key] = collapsed.get(key, 0) + s.count

    sex_parts: list[str] = []
    ls_parts: list[str] = []
    total = 0.0

    for (sex, life_stage), count in collapsed.items():
        total += count
        c = _fmt_count(count)

        if sex != "none":
            if life_stage != "none":
                sex_parts.append(f"{c} {life_stage} {sex}")
            else:
                sex_parts.append(f"{c} {sex}")

        if life_stage != "none":
            if sex != "none":
                ls_parts.append(f"{c} {life_stage} {sex}")
            else:
                ls_parts.append(f"{c} {life_stage}")

    return {
        "quantity": int(total) if total == int(total) else total,
        "sex": " | ".join(sex_parts) if sex_parts else None,
        "life_stage": " | ".join(ls_parts) if ls_parts else None,
    }


def _parse_pipe_column(entry_str: str | None) -> list[Specimen]:
    if not entry_str or not entry_str.strip():
        return []
    results = []
    for part_db in entry_str.split("|"):
        part = part_db.strip()
        if not part:
            continue
        tokens = part.split()
        if len(tokens) < 2:
            continue
        count = float(tokens[0])
        if count == int(count):
            count = int(count)
        if len(tokens) == 3:
            results.append(
                Specimen.model_validate(
                    {"sex": tokens[2], "life_stage": tokens[1], "count": count}
                )
            )
        elif len(tokens) == 2:
            if tokens[1] in SEX_VALUES:
                results.append(
                    Specimen.model_validate(
                        {"sex": tokens[1], "life_stage": "none", "count": count}
                    )
                )
            else:
                results.append(
                    Specimen.model_validate(
                        {"sex": "none", "life_stage": tokens[1], "count": count}
                    )
                )
    return results


def specimens_from_db(
    quantity: float | None, sex: str | None, lifestage: str | None
) -> list[Specimen]:
    sex_entries = _parse_pipe_column(sex)
    ls_entries = _parse_pipe_column(lifestage)

    from_sex = {(e.sex, e.life_stage, e.count) for e in sex_entries}
    from_ls = {(e.sex, e.life_stage, e.count) for e in ls_entries}

    both = from_sex & from_ls
    sex_only = from_sex - from_ls
    ls_only = from_ls - from_sex

    result = [
        Specimen.model_validate({"sex": s, "life_stage": ls, "count": c})
        for s, ls, c in both
    ]
    result.extend(
        Specimen.model_validate({"sex": s, "life_stage": ls, "count": c})
        for s, ls, c in sex_only
    )
    result.extend(
        Specimen.model_validate({"sex": s, "life_stage": ls, "count": c})
        for s, ls, c in ls_only
    )

    if quantity is not None:
        parsed_total = sum(e.count for e in result)
        remainder = round(quantity - parsed_total, 10)
        if remainder > 0:
            result.append(
                Specimen.model_validate(
                    {"sex": "none", "life_stage": "none", "count": remainder}
                )
            )

    return result


def specimens_from_record(record: EventRecord) -> list[Specimen]:
    return specimens_from_db(record.quantity, record.sex, record.life_stage)
