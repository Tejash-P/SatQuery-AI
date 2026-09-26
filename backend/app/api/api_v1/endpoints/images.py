from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.api import deps
from app.models.image import SatelliteImage
from app.models.project import Project
from app.models.user import User
from app.schemas.image import ImageResponse, ModalityUpdate
from app.services.image_service import process_and_save_image

router = APIRouter()

@router.post("/upload", response_model=ImageResponse)
def upload_image(
    project_id: int = Form(...),
    file: UploadFile = File(...),
    sensor_name: Optional[str] = Form(None),
    acquisition_date: Optional[str] = Form(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles("ADMIN", "ANALYST"))
) -> ImageResponse:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return process_and_save_image(db, project_id, file, sensor_name, acquisition_date)

@router.get("/project/{project_id}", response_model=List[ImageResponse])
def list_project_images(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> List[ImageResponse]:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(SatelliteImage).filter(SatelliteImage.project_id == project_id).all()

@router.get("/{image_id}", response_model=ImageResponse)
def get_image(
    image_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> ImageResponse:
    image = db.query(SatelliteImage).join(Project).filter(SatelliteImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image

@router.patch("/{image_id}/modality", response_model=ImageResponse)
def update_modality(
    image_id: int,
    modality_in: ModalityUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles("ADMIN", "ANALYST"))
) -> ImageResponse:
    image = db.query(SatelliteImage).join(Project).filter(SatelliteImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    if current_user.role.upper() != "ADMIN" and image.project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Image not found")
    image.modality = modality_in.modality
    db.commit()
    db.refresh(image)
    return image

@router.get("/{image_id}/file")
def get_image_file(
    image_id: int,
    db: Session = Depends(deps.get_db),
):
    import os
    from fastapi.responses import FileResponse
    from app.core.config import settings
    image = db.query(SatelliteImage).filter(SatelliteImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    local_path = os.path.join(settings.STORAGE_PATH, image.storage_path)
    if os.path.exists(local_path):
        media_type = "image/png"
        if image.file_type in [".jpg", ".jpeg"]:
            media_type = "image/jpeg"
        elif image.file_type in [".tif", ".tiff"]:
            media_type = "image/tiff"
        return FileResponse(local_path, media_type=media_type)
    
    raise HTTPException(status_code=404, detail="Image file not found on disk")
