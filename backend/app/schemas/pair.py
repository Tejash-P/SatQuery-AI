from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PairBase(BaseModel):
    image1_id: int
    image2_id: int

class PairCreate(PairBase):
    project_id: int

class PairResponse(PairBase):
    id: int
    project_id: int
    pair_type: Optional[str]
    overlap_percentage: Optional[float]
    resolution_mismatch: Optional[float]
    time_difference_days: Optional[int]
    validation_status: str
    compatibility_score: Optional[float]
    warnings: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
