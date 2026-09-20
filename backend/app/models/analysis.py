from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=True)
    pair_id = Column(Integer, ForeignKey("pairs.id"), nullable=True)
    
    query = Column(String, nullable=False)
    status = Column(String, default="PENDING") # PENDING, RUNNING, COMPLETED, FAILED
    detected_intent = Column(String)
    
    plan = Column(JSON) # Planned tool sequence
    execution_trace = Column(JSON) # Step-by-step logs and output
    
    result_text = Column(Text)
    confidence_score = Column(Float)
    visual_evidence = Column(JSON) # GeoJSON, bbox list, mask paths/overlays
    metrics = Column(JSON) # Statistics (hectares, counts, change %)
    error_message = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project")
    image = relationship("SatelliteImage", foreign_keys=[image_id])
    pair = relationship("ImagePair", foreign_keys=[pair_id])

    @property
    def owner_email(self):
        return self.project.owner.email if self.project and self.project.owner else None

    @property
    def owner_role(self):
        return self.project.owner.role if self.project and self.project.owner else None
