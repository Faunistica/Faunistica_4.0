from schemas.records import RecordType, RecordUpdate


def mock_validate_record(data: RecordUpdate) -> str | None:
    errors: list[str] = []

    if not data.publ_id or isinstance(data.publ_id, type(None)):
        errors.append("publ_id is required")

    user_id_val = data.user_id
    if user_id_val is None or isinstance(user_id_val, type(None)):
        errors.append("user_id is required")

    if not data.family:
        errors.append("family is required")
    if not data.genus:
        errors.append("genus is required")
    if not data.species:
        errors.append("species is required")

    lat = data.latitude
    if lat is not None and (lat < -90 or lat > 90):
        errors.append("latitude must be between -90 and 90")

    lon = data.longitude
    if lon is not None and (lon < -180 or lon > 180):
        errors.append("longitude must be between -180 and 180")

    if errors:
        return "; ".join(errors)
    return None


def mock_determine_type(errors: str | None) -> RecordType:
    return "valid" if errors is None else "invalid"
