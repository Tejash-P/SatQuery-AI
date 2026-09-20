from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    aoi_wkt: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    aoi_wkt: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    owner_id: int
    status: Optional[str] = "ACTIVE"
    created_at: datetime
    owner_email: Optional[str] = None
    owner_role: Optional[str] = None

    class Config:
        from_attributes = True
