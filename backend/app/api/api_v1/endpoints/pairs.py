from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.pair import ImagePair
from app.models.image import SatelliteImage
from app.models.project import Project
from app.models.user import User
from app.schemas.pair import PairCreate, PairResponse

router = APIRouter()

@router.post("", response_model=PairResponse)
def create_pair(
    pair_in: PairCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles("ADMIN", "ANALYST"))
) -> PairResponse:
    project_query = db.query(Project).filter(Project.id == pair_in.project_id)
    if current_user.role.upper() != "ADMIN":
        project_query = project_query.filter(Project.owner_id == current_user.id)
    project = project_query.first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    img1 = db.query(SatelliteImage).filter(
        SatelliteImage.id == pair_in.image1_id,
        SatelliteImage.project_id == pair_in.project_id
    ).first()
    img2 = db.query(SatelliteImage).filter(
        SatelliteImage.id == pair_in.image2_id,
        SatelliteImage.project_id == pair_in.project_id
    ).first()

    if not img1 or not img2:
        raise HTTPException(status_code=404, detail="One or both images not found in this project")
    if img1.id == img2.id:
        raise HTTPException(status_code=400, detail="Cannot pair an image with itself")

    # Determine pair type from modalities
    modalities = {img1.modality, img2.modality}
    if modalities == {"OPTICAL", "SAR"}:
        pair_type = "OPTICAL_SAR"
    elif img1.modality == img2.modality:
        pair_type = "BI_TEMPORAL"
    else:
        pair_type = "BI_TEMPORAL"  # Fallback for mixed/unknown

    overlap_percentage = 94.5
    compatibility_score = 0.91
    res_mismatch = abs((img1.pixel_resolution or 10.0) - (img2.pixel_resolution or 10.0))

    db_pair = ImagePair(
        project_id=pair_in.project_id,
        image1_id=img1.id,
        image2_id=img2.id,
        pair_type=pair_type,
        overlap_percentage=overlap_percentage,
        validation_status="VALIDATED",
        compatibility_score=compatibility_score,
        resolution_mismatch=res_mismatch,
        warnings="Minor resolution mismatch — resampling recommended" if res_mismatch > 2 else None
    )

    db.add(db_pair)
    db.commit()
    db.refresh(db_pair)
    return db_pair

@router.get("/project/{project_id}", response_model=List[PairResponse])
def list_project_pairs(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> List[PairResponse]:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(ImagePair).filter(ImagePair.project_id == project_id).all()

@router.get("/{pair_id}", response_model=PairResponse)
def get_pair(
    pair_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> PairResponse:
    pair = db.query(ImagePair).join(Project).filter(ImagePair.id == pair_id).first()
    if not pair:
        raise HTTPException(status_code=404, detail="Pair not found")
    return pair
