from fastapi import APIRouter, Depends, File, UploadFile

from app.core.deps import get_current_user
from app.models.schemas import RobotTelemetry
from app.services.robot_simulator import robot_simulator

router = APIRouter()


@router.get("/status", response_model=RobotTelemetry)
async def robot_status(_: dict = Depends(get_current_user)) -> RobotTelemetry:
    return robot_simulator.telemetry


@router.post("/calibrate/{calibration_type}")
async def calibrate(calibration_type: str, _: dict = Depends(get_current_user)) -> dict:
    return {"type": calibration_type, "status": "completed"}


@router.get("/firmware")
async def firmware_info(_: dict = Depends(get_current_user)) -> dict:
    version = robot_simulator.telemetry.firmware
    return {"currentVersion": version, "latestVersion": version, "upToDate": True}


@router.post("/firmware/update")
async def update_firmware(
    file: UploadFile = File(...), _: dict = Depends(get_current_user)
) -> dict:
    contents = await file.read()
    return {"filename": file.filename, "size": len(contents), "status": "uploaded"}
