from schema.records import RecordType, RecordUpdate


def mock_validate_record(data: RecordUpdate) -> str | None:
    errors: list[str] = []

    if not data.family:
        errors.append("family is required")
    if not data.genus:
        errors.append("genus is required")
    if not data.species:
        errors.append("species is required")

    lat = data.latitude
    if isinstance(lat, (int, float)) and (lat < -90 or lat > 90):
        errors.append("latitude must be between -90 and 90")

    lon = data.longitude
    if isinstance(lon, (int, float)) and (lon < -180 or lon > 180):
        errors.append("longitude must be between -180 and 180")

    if errors:
        return "; ".join(errors)
    return None


def mock_determine_type(errors: str | None) -> RecordType:
    return "valid" if errors is None else "invalid"
