import io
from datetime import date

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from openpyxl import Workbook

from core.dependencies import DBSession
from core.exceptions import InternalError
from repository.stats import get_progress, get_project_statistics

router = APIRouter()


@router.get("/report")
async def download_report(session: DBSession) -> StreamingResponse:
    stats = await get_project_statistics(session)
    total, processed, _ = await get_progress(session)

    wb = Workbook()
    ws = wb.active
    if ws is None:
        raise InternalError("couldn't create xlsx response")

    ws.title = "Report"

    today = date.today().isoformat()
    ws.append([f"Отчет на {today}"])
    ws.append([])
    ws.append(["Metric", "Value"])
    ws.append(["Total users", stats.get("total_users", 0)])
    ws.append(["Total publications in DB", total])
    ws.append(["Publications processed", processed])
    ws.append(["Checks done", stats.get("checks_count", 0)])
    ws.append(["Failed records", stats.get("failed_records", 0)])
    ws.append(["Total records entered", stats.get("total_records", 0)])
    ws.append(["Species count", stats.get("species_count", 0)])
    ws.append(["Families count", stats.get("families_count", 0)])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=Report_{today}.xlsx"},
    )
