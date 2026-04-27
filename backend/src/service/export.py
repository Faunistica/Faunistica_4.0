import io
import logging
from collections.abc import Generator, Sequence

from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter

from core.model import EventRecord

logger = logging.getLogger(__name__)

# Ключи — атрибуты модели Record
COLUMN_MAPPING = {
    "datetime": "Дата добавления записи",
    "countrycode": "Страна",
    "stateprovince": "Регион",
    "county": "Район",
    "verbatimlocality": "Место сбора",
    "decimallatitude": "Широта (десятич.)",
    "decimallongitude": "Долгота (десятич.)",
    "verbatimcoordinates": "Координаты (изнач.)",
    "georeferencedby": "Происхождение координат",
    "locationremarks": "Примечания к расположению",
    "verbatimeventdate": "Дата (текст)",
    "dttm_precision": "Точность даты",
    "habitat": "Биотоп",
    "samplingeffort": "Выборочное усиление",
    "recordedby": "Коллектор",
    "eventremarks": "Примечания к сбору материала",
    "family": "Семейство",
    "genus": "Род",
    "specificepithet": "Вид",
    "taxonrank": "Таксон. ранг",
    "type_status": "Типовой статус",
    "taxonremarks": "Таксономические примечания",
    "organismquantity": "Общее кол-во особей",
    "organismquantitytype": "Тип кол-ва",
    "lifestage": "Стадия",
    "occurrenceremarks": "Комментарий к особям",
    "coordinateuncertaintyinmeters": "Радиус неточности координат, м",
}


def records_to_excel(records: Sequence[EventRecord]) -> Generator[bytes]:
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
