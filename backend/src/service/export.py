import io
import logging
from collections.abc import Generator, Sequence

from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter

from core.model import EventRecord

logger = logging.getLogger(__name__)


def records_to_csv(records: Sequence[EventRecord]) -> Generator[bytes]:
    output = io.BytesIO()
    wb = Workbook()
    ws = wb.active

    if ws is None:
        logger.error("ws is None")
        raise Exception

    headers = [
        COLUMN_MAPPING[field]
        for field in COLUMN_MAPPING
        if field not in ["id", "publ_id", "ip", "errors", "type", "adm_verbatim"]
    ]
    ws.append(headers)

    for col in range(1, len(headers) + 1):
        ws.column_dimensions[get_column_letter(col)].width = 20
        ws.cell(row=1, column=col).font = Font(bold=True)

    for record in records:
        row = [
            getattr(record, field)
            for field in COLUMN_MAPPING
            if field not in ["id", "publ_id", "ip", "errors", "type", "adm_verbatim"]
        ]
        ws.append(row)

    wb.save(output)
    output.seek(0)
    yield output.read()
