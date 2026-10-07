from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime

class GeoFileResponse(BaseModel):
    id: str
    filename: str
    feature_count: Optional[int] = None
    crs: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class MeasurementInfo(BaseModel):
    area_m2: Optional[float] = None
    length_m: Optional[float] = None
    unsupported: Optional[bool] = None

class FeatureResponse(BaseModel):
    feature_id: int
    geometry_type: str
    geometry: Optional[Dict[str, Any]] = None
    crs: Optional[str] = None
    properties: Dict[str, Any] = {}
    measurements: MeasurementInfo

class MeasurementsResponse(BaseModel):
    file_id: str
    filename: str
    total_features: int
    features: List[FeatureResponse]
