def clean_value[T](value: T | None) -> T | None:
    if value in ("", None, [], 0, 0.0):
        return None
    return value
