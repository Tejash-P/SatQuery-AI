from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    aoi_wkt = Column(String)  # WKT or GeoJSON for area of interest
    status = Column(String, default="ACTIVE")
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User")

    @property
    def owner_email(self):
        return self.owner.email if self.owner else None

    @property
    def owner_role(self):
        return self.owner.role if self.owner else None
