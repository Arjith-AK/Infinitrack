from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.data.store import missions, utc_now
from app.models.schemas import Mission, MissionCreate
from app.utils.ids import new_id

router = APIRouter()


@router.get("", response_model=list[Mission])
async def list_missions(_: dict = Depends(get_current_user)) -> list[Mission]:
    return list(missions.values())


@router.get("/{mission_id}", response_model=Mission)
async def get_mission(mission_id: str, _: dict = Depends(get_current_user)) -> Mission:
    mission = missions.get(mission_id)
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")
    return mission


@router.post("", response_model=Mission)
async def create_mission(body: MissionCreate, _: dict = Depends(get_current_user)) -> Mission:
    mission_id = new_id()
    mission = Mission(
        id=mission_id,
        name=body.name or f"{body.sport}-mission-{mission_id}",
        sport=body.sport,
        groundName=body.groundName or "Field Area",
        polygon=body.polygon,
        field=body.field,
        waypoints=body.waypoints,
        distance=body.distance,
        estimatedTime=body.estimatedTime,
        batteryUsage=body.batteryUsage,
        powderUsage=body.powderUsage,
        numberOfTurns=body.numberOfTurns,
        status="draft",
        createdAt=utc_now(),
        updatedAt=utc_now(),
    )
    missions[mission.id] = mission
    return mission


def _set_status(mission_id: str, new_status: str) -> Mission:
    mission = missions.get(mission_id)
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")
    updated = mission.model_copy(update={"status": new_status, "updatedAt": utc_now()})
    missions[mission_id] = updated
    return updated


@router.post("/{mission_id}/upload", response_model=Mission)
async def upload_mission(mission_id: str, _: dict = Depends(get_current_user)) -> Mission:
    return _set_status(mission_id, "ready")


@router.post("/{mission_id}/start", response_model=Mission)
async def start_mission(mission_id: str, _: dict = Depends(get_current_user)) -> Mission:
    return _set_status(mission_id, "running")


@router.post("/{mission_id}/pause", response_model=Mission)
async def pause_mission(mission_id: str, _: dict = Depends(get_current_user)) -> Mission:
    return _set_status(mission_id, "paused")


@router.post("/{mission_id}/stop", response_model=Mission)
async def stop_mission(mission_id: str, _: dict = Depends(get_current_user)) -> Mission:
    return _set_status(mission_id, "completed")
