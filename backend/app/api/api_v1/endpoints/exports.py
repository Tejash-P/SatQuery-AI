import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from io import StringIO
import csv as csv_module

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.analysis import AnalysisJob
from app.models.project import Project

router = APIRouter()

@router.get("/{job_id}/json")
def export_json(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(AnalysisJob).join(Project).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    data = {
        "job_id": job.id,
        "query": job.query,
        "detected_intent": job.detected_intent,
        "status": job.status,
        "confidence_score": job.confidence_score,
        "result_text": job.result_text,
        "execution_trace": job.execution_trace or [],
        "plan": job.plan or [],
        "visual_evidence": job.visual_evidence or {},
        "metrics": job.metrics or {},
        "created_at": str(job.created_at),
        "completed_at": str(job.completed_at)
    }
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": f"attachment; filename=satquery_job_{job_id}.json"}
    )

@router.get("/{job_id}/csv")
def export_csv(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(AnalysisJob).join(Project).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    output = StringIO()
    writer = csv_module.writer(output)

    metrics = job.metrics or {}
    writer.writerow(["Field", "Value"])
    writer.writerow(["Job ID", job.id])
    writer.writerow(["Query", job.query])
    writer.writerow(["Detected Intent", job.detected_intent])
    writer.writerow(["Confidence Score", job.confidence_score])
    writer.writerow(["Status", job.status])
    writer.writerow(["Created At", str(job.created_at)])

    if metrics:
        writer.writerow([])
        writer.writerow(["--- Metrics ---", ""])
        for k, v in metrics.items():
            if not isinstance(v, (list, dict)):
                writer.writerow([k, v])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=satquery_metrics_{job_id}.csv"}
    )

@router.get("/{job_id}/geojson")
def export_geojson(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(AnalysisJob).join(Project).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    visual_evidence = job.visual_evidence or {}
    geojson = visual_evidence.get("geojson", {
        "type": "FeatureCollection",
        "features": []
    })

    return JSONResponse(
        content=geojson,
        headers={"Content-Disposition": f"attachment; filename=satquery_grounding_{job_id}.geojson"}
    )
