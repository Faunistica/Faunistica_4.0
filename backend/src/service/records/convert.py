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

    total = sum(collapsed.values())

    sex_entries = [(s, ls, c) for (s, ls), c in collapsed.items() if s != "none"]
    unique_non_none_ls = {ls for _, ls, _ in sex_entries if ls != "none"}
    has_none_ls_among_sex = any(ls == "none" for _, ls, _ in sex_entries)
    omit_ls_in_sex = len(unique_non_none_ls) == 1 and not has_none_ls_among_sex

    sex_parts: list[str] = []
    for sex, life_stage, count in sex_entries:
        c_str = _fmt_count(count)
        if life_stage != "none" and not omit_ls_in_sex:
            sex_parts.append(f"{c_str} {life_stage} {sex}")
        else:
            sex_parts.append(f"{c_str} {sex}")

    ls_collapsed: dict[str, float] = {}
    for (_, life_stage), count in collapsed.items():
        if life_stage != "none":
            ls_collapsed[life_stage] = ls_collapsed.get(life_stage, 0) + count

    ls_parts = [_fmt_count(c) + " " + ls for ls, c in ls_collapsed.items()]

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


def _match_sex_to_ls(
    sex_without_ls: list[Specimen], ls_specimens: list[Specimen]
) -> tuple[list[Specimen], list[Specimen]]:
    """Match sex entries without lifestage to ls entries.
    Returns (matched_specimens, unmatched_ls_entries)."""
    unique_ls = {s.life_stage for s in ls_specimens}
    sex_total = sum(s.count for s in sex_without_ls)
    ls_total = sum(s.count for s in ls_specimens)

    if len(unique_ls) == 1 and abs(sex_total - ls_total) < 1e-9:
        common_ls = unique_ls.pop()
        return (
            [
                Specimen.model_validate(
                    {"sex": s.sex, "life_stage": common_ls, "count": s.count}
                )
                for s in sex_without_ls
            ],
            [],
        )

    unmatched_ls = list(ls_specimens)
    matched: list[Specimen] = []
    for s in sex_without_ls:
        found = False
        for i, ls in enumerate(unmatched_ls):
            if abs(ls.count - s.count) < 1e-9:
                matched.append(
                    Specimen.model_validate(
                        {"sex": s.sex, "life_stage": ls.life_stage, "count": s.count}
                    )
                )
                unmatched_ls.pop(i)
                found = True
                break
        if not found:
            matched.append(s)
    return matched, unmatched_ls


def _add_uncovered_ls(
    result: list[Specimen], ls_specimens: list[Specimen], base: list[Specimen]
) -> None:
    """Add ls entries not already covered by base specimens."""
    for ls in ls_specimens:
        covered = sum(sp.count for sp in base if sp.life_stage == ls.life_stage)
        remaining = ls.count - covered
        if remaining > 1e-9:
            result.append(
                Specimen.model_validate(
                    {"sex": "none", "life_stage": ls.life_stage, "count": remaining}
                )
            )


def specimens_from_db(
    quantity: float | None, sex: str | None, lifestage: str | None
) -> list[Specimen]:
    sex_specimens = _parse_pipe_column(sex)
    ls_specimens = _parse_pipe_column(lifestage)

    sex_with_ls = [s for s in sex_specimens if s.life_stage != "none"]
    sex_without_ls = [s for s in sex_specimens if s.life_stage == "none"]

    result = list(sex_with_ls)

    if sex_without_ls:
        if ls_specimens:
            matched, unmatched_ls = _match_sex_to_ls(sex_without_ls, ls_specimens)
            result.extend(matched)
            _add_uncovered_ls(result, unmatched_ls, sex_with_ls)
        else:
            result.extend(sex_without_ls)
    else:
        _add_uncovered_ls(result, ls_specimens, result)

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
