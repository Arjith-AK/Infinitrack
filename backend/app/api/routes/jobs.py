from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.deps import get_current_user
from app.data.store import jobs, utc_now
from app.models.schemas import Job, JobCreate, JobUpdate
from app.utils.ids import new_id

router = APIRouter()


@router.get("", response_model=list[Job])
async def list_jobs(_: dict = Depends(get_current_user)) -> list[Job]:
    return list(jobs.values())


@router.post("", response_model=Job)
async def create_job(body: JobCreate, _: dict = Depends(get_current_user)) -> Job:
    job = Job(
        id=new_id(),
        name=body.name,
        groundName=body.groundName,
        sport=body.sport,
        mission=body.mission,
        createdAt=utc_now(),
        updatedAt=utc_now(),
    )
    jobs[job.id] = job
    return job


@router.put("/{job_id}", response_model=Job)
async def update_job(job_id: str, body: JobUpdate, _: dict = Depends(get_current_user)) -> Job:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updated = job.model_copy(update={**updates, "updatedAt": utc_now()})
    jobs[job_id] = updated
    return updated


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(job_id: str, _: dict = Depends(get_current_user)) -> None:
    jobs.pop(job_id, None)


@router.get("/{job_id}/export")
async def export_job(job_id: str, _: dict = Depends(get_current_user)) -> Response:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return Response(
        content=job.model_dump_json(indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{job.name}.json"'},
    )
