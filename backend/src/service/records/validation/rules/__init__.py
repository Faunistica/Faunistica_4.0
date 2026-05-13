"""Record validation rules.

Rules are defined in category-specific modules (taxonomy, geo, event, etc.)
and auto-discovered via import. Each rule is registered using the @rule(...)
decorator or rule() direct-call pattern.

The rule function signature is:
    (RecordData, RuleContext) -> str | None

Returning a string means the record failed validation; None means it passed.

Categories group related fields (see RuleCategory).
"""

# If we remove this imports, those files won't be loaded and rules
# and rules from them won't be applied
from . import (
    abundance,  # noqa: F401
    event,  # noqa: F401
    geo,  # noqa: F401
    location,  # noqa: F401
    taxonomy,  # noqa: F401
)
from .base import (
    Rule,
    RuleCategory,
    RuleContext,
    RuleFunc,
    all_rules,
    in_range,
    in_set,
    min_length,
    required,
    rule,
)

__all__ = [
    "RuleCategory",
    "RuleContext",
    "RuleFunc",
    "Rule",
    "all_rules",
    "rule",
    "required",
    "in_set",
    "in_range",
    "min_length",
]
