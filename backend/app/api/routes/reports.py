from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.deps import get_current_user
from app.data.store import missions, reports, utc_now
from app.models.schemas import Report, ReportGenerateRequest
from app.utils.ids import new_id

router = APIRouter()


@router.get("", response_model=list[Report])
async def list_reports(_: dict = Depends(get_current_user)) -> list[Report]:
    return list(reports.values())


@router.post("/generate", response_model=Report)
async def generate_report(
    body: ReportGenerateRequest, current_user: dict = Depends(get_current_user)
) -> Report:
    mission = missions.get(body.missionId)
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")

    report = Report(
        id=new_id(),
        groundName=mission.groundName,
        operator=current_user.get("email", "operator"),
        date=utc_now(),
        area=0,
        distance=mission.distance,
        battery=mission.batteryUsage,
        powder=mission.powderUsage,
        time=mission.estimatedTime,
        accuracy=0.8,
        sport=mission.sport,
    )
    reports[report.id] = report
    return report


@router.get("/{report_id}/pdf")
async def download_report(report_id: str, _: dict = Depends(get_current_user)) -> Response:
    report = reports.get(report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    content = (
        "InfiniTrack Mission Report\n"
        f"Ground: {report.groundName}\n"
        f"Operator: {report.operator}\n"
        f"Date: {report.date}\n"
        f"Distance: {report.distance}m\n"
        f"Powder: {report.powder}kg\n"
        f"Time: {report.time}s\n"
    )
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="report-{report_id}.pdf"'},
    )
