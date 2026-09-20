from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class SatelliteImage(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    filename = Column(String, index=True, nullable=False)
    file_type = Column(String)
    storage_path = Column(String)
    modality = Column(String) # OPTICAL, SAR, MULTISPECTRAL, UNKNOWN
    sensor_name = Column(String)
    acquisition_date = Column(DateTime)
    
    # Raster Metadata
    crs = Column(String)
    width = Column(Integer)
    height = Column(Integer)
    band_count = Column(Integer)
    pixel_resolution = Column(Float)
    bounds = Column(String) # WKT or JSON representation
    cloud_cover = Column(Float)
    
    validation_status = Column(String, default="PENDING")
    validation_messages = Column(JSON)
    metadata_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project")
