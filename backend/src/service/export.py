import csv
import io
import logging
from collections.abc import Sequence
from typing import TypedDict

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter

from core.model import EventRecord
from schema.records import RecordData

logger = logging.getLogger(__name__)

COLUMN_MAPPING: dict[str, str] = {
    "country": "Country",
    "region": "Region",
    "district": "District",
    "locality": "Locality",
    "is_manual_location": "Manual Location",
    "latitude": "Latitude",
    "longitude": "Longitude",
    "verbatimcoordinates": "Verbatim Coordinates",
    "coordinate_uncertainty": "Coordinate Uncertainty (m)",
    "georef_source": "Georef Source",
    "location_remarks": "Location Remarks",
    "verbatim_date": "Date",
    "date_precision": "Date Precision",
    "is_interval": "Date Interval",
    "habitat": "Habitat",
    "sampling_protocol": "Sampling Protocol",
    "sampling_effort": "Sampling Effort",
    "sample_size_value": "Sample Size Value",
    "sample_size_unit": "Sample Size Unit",
    "event_remarks": "Event Remarks",
    "field_number": "Field Number",
    "catalog_number": "Catalog Number",
    "collection_code": "Collection Code",
    "recorded_by": "Recorded By",
    "family": "Family",
    "genus": "Genus",
    "species": "Species",
    "tax_verbatim": "Taxon Verbatim",
    "taxon_rank": "Taxon Rank",
    "type_status": "Type Status",
    "accepted_name": "Accepted Name",
    "taxon_remarks": "Taxon Remarks",
    "quantity": "Quantity",
    "quantity_type": "Quantity Type",
    "sex": "Sex",
    "life_stage": "Life Stage",
    "occurrence_remarks": "Occurrence Remarks",
    "identification_remarks": "Identification Remarks",
}


REVERSE_COLUMN_MAPPING: dict[str, str] = {v: k for k, v in COLUMN_MAPPING.items()}


class ImportRecordData(TypedDict):
    record_data: RecordData
    errors: str | None
    record_type: str


BOOLEAN_TRUE_VALUES: frozenset[str] = frozenset({"TRUE", "YES", "1", "T", "Y"})
BOOLEAN_FALSE_VALUES: frozenset[str] = frozenset({"FALSE", "NO", "0", "F", "N"})

FLOAT_FIELDS: frozenset[str] = frozenset({
    "latitude",
    "longitude",
    "coordinate_uncertainty",
    "sample_size_value",
    "quantity",
})

BOOLEAN_FIELDS: frozenset[str] = frozenset({
    "is_manual_location",
    "is_interval",
    "tax_verbatim",
})


def _convert_bool(str_value: str) -> bool | None:
    upper = str_value.upper()
    if upper in BOOLEAN_TRUE_VALUES:
        return True
    if upper in BOOLEAN_FALSE_VALUES:
        return False
    return None


def _convert_value(field: str, value: object) -> object:
    if value is None or value == "":
        return None
    str_value = str(value).strip()
    if field in BOOLEAN_FIELDS:
        return _convert_bool(str_value)
    if field in FLOAT_FIELDS:
        try:
            return float(str_value)
        except ValueError:
            return None
    return str_value


def is_row_empty(row: dict[str, str | None]) -> bool:
    return all(v is None or str(v).strip() == "" for v in row.values())


def row_to_record_data(row: dict[str, str | None], publ_id: int) -> RecordData:
    data = RecordData(publ_id=publ_id)
    for display_name, field in REVERSE_COLUMN_MAPPING.items():
        raw_value = row.get(display_name)
        converted = _convert_value(field, raw_value)
        if converted is not None:
            setattr(data, field, converted)
    return data


async def read_excel(file_content: bytes) -> list[dict[str, str | None]]:
    wb = load_workbook(filename=io.BytesIO(file_content), read_only=True)
    ws = wb.active
    if ws is None:
        return []
    rows: list[dict[str, str | None]] = []
    headers: list[str] = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            headers = [str(cell) if cell is not None else "" for cell in row]
        else:
            row_dict: dict[str, str | None] = {
                headers[j]: (str(row[j]) if row[j] is not None else None)
                for j in range(len(headers))
                if j < len(row)
            }
            rows.append(row_dict)
    wb.close()
    return rows


async def read_csv(file_content: bytes) -> list[dict[str, str | None]]:
    text = file_content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    return [{k: (v if v else None) for k, v in row.items()} for row in reader]


def records_to_excel(records: Sequence[EventRecord]) -> bytes:
    wb = Workbook()
    ws = wb.active

    if ws is None:
        logger.error("ws is None")
        raise Exception

    headers = [COLUMN_MAPPING[field] for field in COLUMN_MAPPING]
    ws.append(headers)

    for col in range(1, len(headers) + 1):
        ws.column_dimensions[get_column_letter(col)].width = 20
        ws.cell(row=1, column=col).font = Font(bold=True)

    for record in records:
        row = [getattr(record, field, None) for field in COLUMN_MAPPING]
        ws.append(row)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output.read()


def records_to_csv(records: Sequence[EventRecord]) -> str:
    output = io.StringIO()
    fieldnames = [COLUMN_MAPPING[field] for field in COLUMN_MAPPING]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for record in records:
        row = {
            COLUMN_MAPPING[field]: getattr(record, field, None)
            for field in COLUMN_MAPPING
        }
        writer.writerow(row)

    return output.getvalue()
