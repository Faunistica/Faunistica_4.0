import io
import logging
from collections.abc import Sequence

from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter
from starlette.responses import ContentStream

from database.models import Record

logger = logging.getLogger(__name__)
COLUMN_MAPPING = {
    "datetime": "Дата добавления записи",
    "adm_country": "Страна",
    "adm_region": "Регион",
    "adm_district": "Район",
    "adm_loc": "Место сбора",
    "geo_nn": "Широта (десятич.)",
    "geo_ee": "Долгота (десятич.)",
    "geo_nn_raw": "Широта (изнач.)",
    "geo_ee_raw": "Долгота (изнач.)",
    "geo_origin": "Происхождение координат",
    "geo_REM": "Примечания к расположению",
    "eve_YY": "Год",
    "eve_MM": "Месяц",
    "eve_DD": "День",
    "eve_day_def": "Определён ли день",
    "eve_habitat": "Биотоп",
    "eve_effort": "Выборочное усиление",
    "abu_coll": "Коллектор",
    "eve_REM": "Примечания к сбору материала",
    "tax_fam": "Семейство",
    "tax_gen": "Род",
    "tax_sp": "Вид",
    "tax_sp_def": "Определён ли вид",
    "tax_nsp": "Описан ли как новый вид",
    "type_status": "Типовой статус",
    "tax_REM": "Таксономические примечания",
    "abu": "Общее кол-во особей",
    "abu_details": "Кол-во особей каждого пола/зрелости",
    "abu_ind_rem": "Комментарий к особям",
    "geo_uncert": "Радиус неточности координат, м",
    "eve_YY_end": "Конечный год",
    "eve_MM_end": "Конечный месяц",
    "eve_DD_end": "Конечный день",
}


class ExportService:
    def records_to_excel(self, records: Sequence[Record]) -> ContentStream:
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
                if field
                not in ["id", "publ_id", "ip", "errors", "type", "adm_verbatim"]
            ]
            ws.append(row)

        wb.save(output)
        output.seek(0)
        yield output.read()
