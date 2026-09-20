from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class ImageBase(BaseModel):
    filename: str
    file_type: Optional[str] = None
    modality: Optional[str] = None
    sensor_name: Optional[str] = None
    acquisition_date: Optional[datetime] = None
    crs: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    band_count: Optional[int] = None
    pixel_resolution: Optional[float] = None
    cloud_cover: Optional[float] = None
    bounds: Optional[str] = None
    validation_status: Optional[str] = "PENDING"
    validation_messages: Optional[Any] = None

class ImageResponse(ImageBase):
    id: int
    project_id: int
    storage_path: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ModalityUpdate(BaseModel):
    modality: str
