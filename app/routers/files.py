import json
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_db
from app.models import GeoFile, Feature
from app.schemas import GeoFileResponse, MeasurementsResponse, FeatureResponse, MeasurementInfo
from app.services.file_processor import process_geo_file

router = APIRouter(prefix="/api/files", tags=["files"])

ALLOWED_EXTENSIONS = {".zip", ".kml"}


def _validate_extension(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{suffix}'. Accepted: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    return suffix


@router.post("/", response_model=GeoFileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a geospatial file (.zip shapefile or .kml) and process it."""
    _validate_extension(file.filename)

    file_id = str(uuid.uuid4())
    dest_filename = f"{file_id}{Path(file.filename).suffix.lower()}"
    dest_path = settings.UPLOAD_DIR / dest_filename

    with dest_path.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    geo_file = GeoFile(
        id=file_id,
        filename=file.filename,
        filepath=str(dest_path),
        status="PENDING",
    )
    db.add(geo_file)
    db.commit()
    db.refresh(geo_file)

    try:
        process_geo_file(db, file_id, str(dest_path), file.filename)
    except Exception:
        pass

    db.refresh(geo_file)
    return geo_file


@router.get("/{file_id}/", response_model=GeoFileResponse)
def get_file_info(file_id: str, db: Session = Depends(get_db)):
    """Return metadata about an uploaded file."""
    geo_file = db.query(GeoFile).filter(GeoFile.id == file_id).first()
    if not geo_file:
        raise HTTPException(status_code=404, detail="File not found")
    return geo_file


@router.get("/{file_id}/measurements/", response_model=MeasurementsResponse)
def get_measurements(file_id: str, db: Session = Depends(get_db)):
    """Return features and their measurements for an uploaded file."""
    geo_file = db.query(GeoFile).filter(GeoFile.id == file_id).first()
    if not geo_file:
        raise HTTPException(status_code=404, detail="File not found")

    features = (
        db.query(Feature)
        .filter(Feature.file_id == file_id)
        .order_by(Feature.feature_index)
        .all()
    )

    feature_responses = []
    for feat in features:
        geom = json.loads(feat.geometry) if feat.geometry else None
        props = json.loads(feat.properties) if feat.properties else {}

        if feat.area_m2 is not None:
            meas = MeasurementInfo(area_m2=feat.area_m2)
        elif feat.length_m is not None:
            meas = MeasurementInfo(length_m=feat.length_m)
        elif feat.geometry_type in ("Point", "MultiPoint"):
            meas = MeasurementInfo()
        else:
            meas = MeasurementInfo(unsupported=True)

        feature_responses.append(FeatureResponse(
            feature_id=feat.feature_index,
            geometry_type=feat.geometry_type,
            geometry=geom,
            crs=feat.crs,
            properties=props,
            measurements=meas,
        ))

    return MeasurementsResponse(
        file_id=file_id,
        filename=geo_file.filename,
        total_features=len(feature_responses),
        features=feature_responses,
    )
