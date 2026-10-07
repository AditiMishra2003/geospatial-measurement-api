"""Parse a .kml file."""
import json
from typing import List, Dict, Any


def parse_kml(kml_path: str) -> List[Dict[str, Any]]:
    """
    Read features from a KML file.
    KML is always WGS-84 (EPSG:4326).
    """
    import geopandas as gpd

    CRS_STR = "EPSG:4326"

    gdf = None
    errors = []
    # Try pyogrio first (fast, works well on Windows), then fiona, then default
    for engine in ("pyogrio", "fiona", None):
        try:
            kwargs = {"engine": engine} if engine else {}
            gdf = gpd.read_file(kml_path, **kwargs)
            break
        except Exception as e:
            errors.append(str(e))

    if gdf is None:
        raise ValueError(f"Could not read KML file. Errors: {'; '.join(errors)}")

    features = []
    for idx, row in gdf.iterrows():
        geom = row.geometry
        if geom is not None and not geom.is_empty:
            geom_geojson = json.loads(json.dumps(geom.__geo_interface__))
            geom_type = geom.geom_type
        else:
            geom_geojson = None
            geom_type = "Unknown"

        props = {k: v for k, v in row.items() if k != "geometry"}
        props = _serialise_props(props)

        features.append({
            "feature_index": int(idx),
            "geometry_type": geom_type,
            "geometry": geom_geojson,
            "crs": CRS_STR,
            "properties": props,
        })

    return features


def _serialise_props(props: dict) -> dict:
    out = {}
    for k, v in props.items():
        if hasattr(v, "item"):
            v = v.item()
        elif hasattr(v, "isoformat"):
            v = v.isoformat()
        try:
            if v != v:
                v = None
        except TypeError:
            pass
        out[k] = v
    return out
