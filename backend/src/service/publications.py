def pipe_to_array(pipe_str: str) -> list[int]:
    """Convert '123|456|789' to [123, 456, 789]"""
    if not pipe_str:
        return []
    return [int(x) for x in pipe_str.split("|") if x.strip()]


def array_to_pipe(arr: list[int]) -> str:
    """Convert [123, 456, 789] to '123|456|789'"""
    return "|".join(str(x) for x in arr)
