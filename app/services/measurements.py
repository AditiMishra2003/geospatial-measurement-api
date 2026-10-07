"""
Measurement calculations with CRS reprojection.
All measurements are returned in SI units (metres, square metres).
"""
from typing import Optional, Tuple
from shapely.geometry import shape, mapping
from shapely.geometry.base import BaseGeometry
from shapely.ops import transform as shapely_transform
from pyproj import Transformer, CRS


def _utm_epsg_from_centroid(lon: float, lat: float) -> str:
    """Derive the most appropriate UTM EPSG code for a given WGS-84 centroid."""
    zone = int((lon + 180) / 6) + 1
    if lat >= 0:
        epsg = 32600 + zone
    else:
        epsg = 32700 + zone
    return f"EPSG:{epsg}"


def _reproject_geometry(geom: BaseGeometry, src_crs_str: str) -> Tuple[BaseGeometry, str]:
    """
    Reproject geom from src_crs_str to an appropriate projected CRS.
    Returns (reprojected_geometry, target_epsg_string).
    """
    src_crs = CRS.from_user_input(src_crs_str)
    wgs84 = CRS.from_epsg(4326)

    if not src_crs.equals(wgs84):
        to_wgs84 = Transformer.from_crs(src_crs, wgs84, always_xy=True)
        geom_wgs84 = shapely_transform(to_wgs84.transform, geom)
    else:
        geom_wgs84 = geom

    centroid = geom_wgs84.centroid
    target_epsg = _utm_epsg_from_centroid(centroid.x, centroid.y)

    target_crs = CRS.from_user_input(target_epsg)
    transformer = Transformer.from_crs(wgs84, target_crs, always_xy=True)
    projected = shapely_transform(transformer.transform, geom_wgs84)
    return projected, target_epsg


def calculate_measurements(geom_geojson: dict, crs_str: str) -> dict:
    """
    Calculate area/length for supported geometry types.
    Returns a dict suitable for MeasurementInfo.
    """
    if not geom_geojson:
        return {"unsupported": True}

    try:
        geom = shape(geom_geojson)
    except Exception:
        return {"unsupported": True}

    if geom.is_empty:
        return {}

    gtype = geom.geom_type

    if gtype in ("Point", "MultiPoint"):
        return {}

    if gtype in ("Polygon", "MultiPolygon"):
        projected, _ = _reproject_geometry(geom, crs_str)
        return {"area_m2": round(projected.area, 4)}

    if gtype in ("LinearRing", "LineString", "MultiLineString"):
        projected, _ = _reproject_geometry(geom, crs_str)
        return {"length_m": round(projected.length, 4)}

    if gtype == "GeometryCollection":
        total_area = 0.0
        total_length = 0.0
        has_area = False
        has_length = False
        for sub in geom.geoms:
            sub_result = calculate_measurements(mapping(sub), crs_str)
            if "area_m2" in sub_result:
                total_area += sub_result["area_m2"]
                has_area = True
            if "length_m" in sub_result:
                total_length += sub_result["length_m"]
                has_length = True
        result = {}
        if has_area:
            result["area_m2"] = round(total_area, 4)
        if has_length:
            result["length_m"] = round(total_length, 4)
        return result if result else {}

    return {"unsupported": True}
