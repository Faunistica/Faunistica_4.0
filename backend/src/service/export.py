import io
import logging
from collections.abc import Sequence

from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter
from starlette.responses import ContentStream

from database.models import Record

logger = logging.getLogger(__name__)

# Ключи — атрибуты модели Record
COLUMN_MAPPING = {
    "datetime": "Дата добавления записи",
    "country": "Страна",
    "region": "Регион",
    "district": "Район",
    "locality": "Место сбора",
    "latitude": "Широта (десятич.)",
    "longitude": "Долгота (десятич.)",
    "verbatimlatitude": "Широта (изнач.)",
    "verbatimlongitude": "Долгота (изнач.)",
    "georef_source": "Происхождение координат",
    "location_remarks": "Примечания к расположению",
    "year": "Год",
    "month": "Месяц",
    "day": "День",
    "day_defined": "Определён ли день",
    "habitat": "Биотоп",
    "sampling_effort": "Выборочное усиление",
    "recorded_by": "Коллектор",
    "event_remarks": "Примечания к сбору материала",
    "family": "Семейство",
    "genus": "Род",
    "species": "Вид",
    "taxon_rank": "Определён ли вид",
    "is_new_species": "Описан ли как новый вид",
    "type_status": "Типовой статус",
    "taxon_remarks": "Таксономические примечания",
    "quantity": "Общее кол-во особей",
    "abu_details": "Кол-во особей каждого пола/зрелости",
    "occurrence_remarks": "Комментарий к особям",
    "uncertainty": "Радиус неточности координат, м",
    "year_end": "Конечный год",
    "month_end": "Конечный месяц",
    "day_end": "Конечный день",
}


class ExportService:
    def records_to_excel(self, records: Sequence[Record]) -> ContentStream:
        output = io.BytesIO()
        wb = Workbook()
        ws = wb.active

        if ws is None:
            logger.error("ws is None")
            raise Exception

        headers = list(COLUMN_MAPPING.values())
        ws.append(headers)

        for col in range(1, len(headers) + 1):
            ws.column_dimensions[get_column_letter(col)].width = 20
            ws.cell(row=1, column=col).font = Font(bold=True)

        for record in records:
            row = [getattr(record, field) for field in COLUMN_MAPPING]
            ws.append(row)

        wb.save(output)
        output.seek(0)
        yield output.read()