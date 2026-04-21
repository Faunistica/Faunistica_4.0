import io
import logging
from collections.abc import Generator, Sequence

from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter

from models import Record

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
    "verbatimlatitude": "Широта (изнач.)",
    "verbatimlongitude": "Долгота (изнач.)",
    "georeferencedby": "Происхождение координат",
    "locationremarks": "Примечания к расположению",
    "eve_YY": "Год",
    "eve_MM": "Месяц",
    "eve_DD": "День",
    "day_defined": "Определён ли день",
    "habitat": "Биотоп",
    "samplingeffort": "Выборочное усиление",
    "recordedby": "Коллектор",
    "eventremarks": "Примечания к сбору материала",
    "family": "Семейство",
    "genus": "Род",
    "specificepithet": "Вид",
    "taxonrank": "Определён ли вид",
    "tax_nsp": "Описан ли как новый вид",
    "type_status": "Типовой статус",
    "taxonremarks": "Таксономические примечания",
    "organismquantity": "Общее кол-во особей",
    "abu_details": "Кол-во особей каждого пола/зрелости",
    "occurrenceremarks": "Комментарий к особям",
    "coordinateuncertaintyinmeters": "Радиус неточности координат, м",
    "eve_YY_end": "Конечный год",
    "eve_MM_end": "Конечный месяц",
    "eve_DD_end": "Конечный день",
}


def records_to_excel(records: Sequence[Record]) -> Generator[bytes]:
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
