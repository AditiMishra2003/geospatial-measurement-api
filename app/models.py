import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class GeoFile(Base):
    __tablename__ = "geo_files"

    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    feature_count = Column(Integer, nullable=True)
    crs = Column(String, nullable=True)
    status = Column(String, default="PENDING")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Feature(Base):
    __tablename__ = "features"

    id = Column(Integer, primary_key=True, autoincrement=True)
    file_id = Column(String, ForeignKey("geo_files.id"), nullable=False)
    feature_index = Column(Integer, nullable=False)
    geometry_type = Column(String, nullable=False)
    geometry = Column(Text, nullable=True)
    crs = Column(String, nullable=True)
    properties = Column(Text, nullable=True)
    area_m2 = Column(Float, nullable=True)
    length_m = Column(Float, nullable=True)
