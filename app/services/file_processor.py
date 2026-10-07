"""
Orchestrates file parsing and measurement calculation.
"""
import json
from pathlib import Path
from sqlalchemy.orm import Session

from app.models import GeoFile, Feature
from app.services.measurements import calculate_measurements


def process_geo_file(db: Session, file_id: str, filepath: str, filename: str) -> None:
    """
    Parse the uploaded file, compute measurements, and persist Feature rows.
    """
    geo_file = db.query(GeoFile).filter(GeoFile.id == file_id).first()
    if not geo_file:
        return

    geo_file.status = "PROCESSING"
    db.commit()

    try:
        features_data = _parse_file(filepath, filename)

        feature_rows = []
        for fd in features_data:
            measurements = calculate_measurements(fd["geometry"], fd["crs"])
            feature_rows.append(Feature(
                file_id=file_id,
                feature_index=fd["feature_index"],
                geometry_type=fd["geometry_type"],
                geometry=json.dumps(fd["geometry"]) if fd["geometry"] else None,
                crs=fd["crs"],
                properties=json.dumps(fd["properties"]),
                area_m2=measurements.get("area_m2"),
                length_m=measurements.get("length_m"),
            ))

        db.bulk_save_objects(feature_rows)

        crs_values = list({fd["crs"] for fd in features_data if fd.get("crs")})
        geo_file.crs = crs_values[0] if crs_values else None
        geo_file.feature_count = len(features_data)
        geo_file.status = "COMPLETED"
        db.commit()

    except Exception as exc:
        geo_file.status = "FAILED"
        geo_file.error_message = str(exc)
        db.commit()
        raise


def _parse_file(filepath: str, filename: str):
    name_lower = filename.lower()
    if name_lower.endswith(".zip"):
        from app.services.parsers.shapefile import parse_shapefile
        return parse_shapefile(filepath)
    elif name_lower.endswith(".kml"):
        from app.services.parsers.kml import parse_kml
        return parse_kml(filepath)
    else:
        raise ValueError(f"Unsupported file type: {filename}")
