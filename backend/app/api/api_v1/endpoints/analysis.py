from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.api import deps
from app.api.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.image import SatelliteImage
from app.models.pair import ImagePair
from app.models.analysis import AnalysisJob
from app.schemas.analysis import QueryRequest, AnalysisJobResponse, TraceResponse
from app.services.agent.controller import AgentController

router = APIRouter()

@router.post("/query", response_model=AnalysisJobResponse)
def submit_query(
    request: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_roles("ADMIN", "ANALYST"))
):
    project_query = db.query(Project).filter(Project.id == request.project_id)
    if current_user.role.upper() != "ADMIN":
        project_query = project_query.filter(Project.owner_id == current_user.id)
    project = project_query.first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    image_metadata = {}
    if request.image_id:
        img = db.query(SatelliteImage).filter(SatelliteImage.id == request.image_id).first()
        if img:
            image_metadata = {
                "id": img.id,
                "filename": img.filename,
                "modality": img.modality,
                "crs": img.crs,
                "width": img.width,
                "height": img.height,
                "pixel_resolution": img.pixel_resolution,
                "cloud_cover": img.cloud_cover
            }

    pair_metadata = {}
    if request.pair_id:
        pair = db.query(ImagePair).filter(ImagePair.id == request.pair_id).first()
        if pair:
            pair_metadata = {
                "id": pair.id,
                "pair_type": pair.pair_type,
                "overlap_percentage": pair.overlap_percentage,
                "time_difference_days": pair.time_difference_days,
                "compatibility_score": pair.compatibility_score
            }

    # Execute Agent workflow
    try:
        res = AgentController.execute_query(
            query=request.query,
            image_metadata=image_metadata,
            pair_metadata=pair_metadata
        )
        
        job = AnalysisJob(
            project_id=request.project_id,
            image_id=request.image_id,
            pair_id=request.pair_id,
            query=request.query,
            status="COMPLETED",
            detected_intent=res["detected_intent"],
            plan=res["plan"],
            execution_trace=res["execution_trace"],
            result_text=res["result_text"],
            confidence_score=res["confidence_score"],
            visual_evidence=res["visual_evidence"],
            metrics=res["metrics"],
            completed_at=datetime.utcnow()
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job
    except Exception as e:
        job = AnalysisJob(
            project_id=request.project_id,
            image_id=request.image_id,
            pair_id=request.pair_id,
            query=request.query,
            status="FAILED",
            error_message=str(e),
            completed_at=datetime.utcnow()
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

@router.get("/jobs/{job_id}", response_model=AnalysisJobResponse)
def get_job_status(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(AnalysisJob).join(Project).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/jobs/{job_id}/trace", response_model=TraceResponse)
def get_job_trace(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(AnalysisJob).join(Project).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return TraceResponse(
        job_id=job.id,
        status=job.status,
        detected_intent=job.detected_intent,
        plan=job.plan or [],
        execution_trace=job.execution_trace or []
    )

@router.get("/results/{job_id}", response_model=AnalysisJobResponse)
def get_job_result(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(AnalysisJob).join(Project).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/project/{project_id}", response_model=List[AnalysisJobResponse])
def get_project_analyses(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not db.query(Project).filter(Project.id == project_id).first():
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(AnalysisJob).filter(AnalysisJob.project_id == project_id).order_by(AnalysisJob.created_at.desc()).all()
