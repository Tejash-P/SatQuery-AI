from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter()

@router.get("/", response_model=List[ProjectResponse])
def get_projects(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100
) -> List[ProjectResponse]:
    return db.query(Project).order_by(Project.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=ProjectResponse)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles("ADMIN", "ANALYST"))
) -> ProjectResponse:
    project = Project(
        name=project_in.name,
        description=project_in.description,
        aoi_wkt=project_in.aoi_wkt,
        owner_id=current_user.id,
        status="ACTIVE"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> ProjectResponse:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles("ADMIN", "ANALYST"))
) -> ProjectResponse:
    query = db.query(Project).filter(Project.id == project_id)
    if current_user.role.upper() != "ADMIN":
        query = query.filter(Project.owner_id == current_user.id)
    project = query.first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in project_in.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles("ADMIN", "ANALYST"))
):
    query = db.query(Project).filter(Project.id == project_id)
    if current_user.role.upper() != "ADMIN":
        query = query.filter(Project.owner_id == current_user.id)
    project = query.first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return None
