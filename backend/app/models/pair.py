from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class ImagePair(Base):
    __tablename__ = "pairs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    image1_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    image2_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    
    pair_type = Column(String) # BI_TEMPORAL, OPTICAL_SAR, INVALID
    overlap_percentage = Column(Float)
    resolution_mismatch = Column(Float)
    time_difference_days = Column(Integer)
    
    validation_status = Column(String, default="PENDING")
    compatibility_score = Column(Float)
    warnings = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project")
    image1 = relationship("SatelliteImage", foreign_keys=[image1_id])
    image2 = relationship("SatelliteImage", foreign_keys=[image2_id])
